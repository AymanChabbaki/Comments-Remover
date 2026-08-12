import { NextResponse } from 'next/server';
import { isValidMetaSignature } from '../../../lib/verifySignature';
import { getCommentText, deleteComment } from '../../../lib/facebook';
import { shouldDelete } from '../../../lib/moderation';
import * as eventLog from '../../../lib/eventLog';
import * as blocklist from '../../../lib/blocklist';
import * as clients from '../../../lib/clients';

export const runtime = 'nodejs';

// Meta retries webhook deliveries; a bounded recent-IDs cache keeps a
// retried delivery (or an "edited" event for the same comment) from
// being run through moderation twice. Shared across clients since
// comment IDs are already globally unique per platform. Lives at module
// scope, so it persists across warm serverless invocations on the same
// instance (not guaranteed across cold starts -- fine, since it's only
// a de-dupe optimization, not a correctness requirement).
const MAX_SEEN = 5000;
const seenCommentIds = new Set();
function alreadyProcessed(id) {
  if (seenCommentIds.has(id)) return true;
  seenCommentIds.add(id);
  if (seenCommentIds.size > MAX_SEEN) {
    seenCommentIds.delete(seenCommentIds.values().next().value);
  }
  return false;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (
    searchParams.get('hub.mode') === 'subscribe' &&
    searchParams.get('hub.verify_token') === process.env.FB_VERIFY_TOKEN
  ) {
    return new NextResponse(searchParams.get('hub.challenge'), { status: 200 });
  }
  return new NextResponse(null, { status: 403 });
}

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-hub-signature-256');

  if (!isValidMetaSignature(signature, rawBody)) {
    console.warn('Rejecting webhook POST: signature did not match FB_APP_SECRET or IG_APP_SECRET');
    return new NextResponse(null, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  if (process.env.DEBUG_WEBHOOK_PAYLOAD === 'true') {
    console.log('Webhook payload:', rawBody);
  }

  // Awaited (not fire-and-forget) on purpose: a serverless function can
  // be frozen the instant it responds, so "ack now, keep working in the
  // background" -- the original always-on-server pattern -- would risk
  // silently dropping events here. Processing a comment (one Graph API
  // fetch, one OpenAI call, one Graph API delete) normally finishes in
  // well under Meta's several-second retry window, so this is safe.
  try {
    await processEntries(body?.entry || [], body?.object);
  } catch (err) {
    console.error('Error processing webhook payload:', err);
  }

  return new NextResponse(null, { status: 200 });
}

// Pulls {commentId, authorId, ...} out of a change, for either a
// Facebook Page comment (field "feed") or an Instagram comment (field
// "comments"). Returns null if this change isn't a new comment we
// should act on.
function extractComment(change) {
  const value = change.value || {};

  if (change.field === 'feed') {
    if (value.item !== 'comment' || value.verb !== 'add') return null;
    return {
      commentId: value.comment_id,
      authorId: value.from?.id,
      authorName: value.from?.name,
      inlineText: value.message,
      platform: 'facebook',
    };
  }

  if (change.field === 'comments') {
    if (value.verb && value.verb !== 'add') return null;
    return {
      commentId: value.id,
      authorId: value.from?.id,
      authorName: value.from?.username,
      inlineText: value.text,
      platform: 'instagram',
    };
  }

  return null;
}

async function processEntries(entries, object) {
  for (const entry of entries) {
    // entry.id is the Facebook Page ID for "page" object payloads, or
    // the Instagram Business Account ID for "instagram" object payloads
    // -- that's how a shared app-level webhook endpoint knows which
    // onboarded client this event belongs to.
    const client = object === 'instagram' ? await clients.getByIgUserId(entry.id) : await clients.getByPageId(entry.id);
    if (!client || !client.active) continue;

    for (const change of entry.changes || []) {
      const comment = extractComment(change);
      if (!comment) continue;

      const { commentId, authorId, authorName, inlineText, platform } = comment;
      if (!commentId) continue;

      // Skip the Page/IG account's own comments/replies so the bot
      // never evaluates or deletes its own activity.
      if (authorId && (authorId === client.pageId || authorId === client.igUserId)) {
        continue;
      }

      if (alreadyProcessed(commentId)) continue;

      const token = platform === 'instagram' ? client.igAccessToken : client.pageAccessToken;

      // Neither platform's webhook payload reliably includes the comment
      // text inline on current Graph API versions, so fetch it if missing.
      const text = typeof inlineText === 'string' ? inlineText : await getCommentText(commentId, platform, token);
      if (typeof text !== 'string') continue;

      // A previously-deleted author's comments get removed on sight,
      // skipping the OpenAI call entirely -- both faster and cheaper
      // than re-evaluating someone who's already shown they post junk.
      const isRepeatOffender = await blocklist.isBlocked(client.id, platform, authorId);

      try {
        const verdict = isRepeatOffender ? 'DELETE' : (await shouldDelete(text)) ? 'DELETE' : 'KEEP';
        const deleteResult = verdict === 'DELETE' ? await deleteComment(commentId, platform, token) : { ok: false };
        console.log(`[${client.id}] Comment ${commentId}: ${verdict}${isRepeatOffender ? ' (blocklisted author, skipped AI check)' : ''}`);
        await eventLog.record(client.id, {
          commentId, text, verdict, deleted: deleteResult.ok, platform,
          author: authorName, authorId, autoBlocked: isRepeatOffender,
        });

        if (verdict === 'DELETE' && !isRepeatOffender) {
          await blocklist.block(client.id, platform, authorId, authorName, commentId);
        }
      } catch (err) {
        console.error(`[${client.id}] Error moderating comment ${commentId}:`, err.message);
        await eventLog.record(client.id, { commentId, text, verdict: null, deleted: false, error: err.message, platform, author: authorName, authorId });
      }
    }
  }
}
