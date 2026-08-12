import { NextResponse } from 'next/server';
import * as eventLog from '../../../../../../../lib/eventLog';
import * as blocklist from '../../../../../../../lib/blocklist';
import * as clients from '../../../../../../../lib/clients';
import { deleteComment } from '../../../../../../../lib/facebook';
import { isAuthorizedForClient } from '../../../../../../../lib/auth';

export const runtime = 'nodejs';

// Manual delete, for when the moderation model missed a comment it
// should have flagged. Same Graph API call the automatic path uses,
// triggered by a human from the dashboard instead of a webhook event.
// Also blocklists the author, same as an AI-caught delete, so a human
// catching what the model missed still prevents their next comment.
export async function POST(request, { params }) {
  const { clientId, commentId } = await params;

  if (!isAuthorizedForClient(request, clientId)) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }
  const client = await clients.get(clientId);
  if (!client) return NextResponse.json({ success: false, error: 'Unknown client' }, { status: 404 });

  const entry = await eventLog.getByCommentId(clientId, commentId);
  if (!entry) {
    return NextResponse.json({ success: false, error: 'Unknown comment ID' }, { status: 404 });
  }
  if (entry.deleted) {
    return NextResponse.json({ success: true, event: entry });
  }

  const token = entry.platform === 'instagram' ? client.igAccessToken : client.pageAccessToken;
  const result = await deleteComment(commentId, entry.platform, token);
  if (!result.ok) {
    return NextResponse.json({ success: false, error: result.error }, { status: 502 });
  }

  const updated = await eventLog.markDeleted(clientId, commentId);
  if (entry.authorId) {
    await blocklist.block(clientId, entry.platform, entry.authorId, entry.author, commentId);
  }
  return NextResponse.json({ success: true, event: updated });
}
