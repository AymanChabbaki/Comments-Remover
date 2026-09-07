import { randomUUID, createHash } from 'node:crypto';
import axios from 'axios';
import { query } from './db.js';
import * as clients from './clients.js';
import { isEligible, matchesRule } from './messagingPolicy.js';

export const accountFor = (client, platform) => platform === 'instagram' ? client.igUserId : client.pageId;
export const tokenFor = (client, platform) => platform === 'instagram' ? client.igAccessToken : client.pageAccessToken;

export async function recipientPreview(client, platform, ids) {
  const { rows } = await query(`SELECT recipient_id, last_inbound_at FROM messaging_contacts
    WHERE client_id=$1 AND platform=$2 AND account_id=$3 AND recipient_id=ANY($4::text[])`,
  [client.id, platform, accountFor(client, platform), ids]);
  const known = new Map(rows.map(row => [row.recipient_id, row.last_inbound_at]));
  return ids.map(id => ({ id, eligible: isEligible(known.get(id)), reason: !known.has(id)
    ? 'No incoming message recorded for this account' : isEligible(known.get(id)) ? 'Ready' : '24-hour reply window expired' }));
}

async function enqueue(client, platform, kind, recipient, message, key, expires) {
  await query(`INSERT INTO messaging_jobs(id,client_id,platform,account_id,kind,recipient_id,message,dedupe_key,expires_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(client_id,dedupe_key) DO NOTHING`,
  [randomUUID(), client.id, platform, accountFor(client, platform), kind, recipient, message, key, expires]);
}

export async function queueCampaign(client, platform, ids, message, campaignId) {
  const preview = await recipientPreview(client, platform, ids);
  // A reused request ID must never turn an edited request into an additional send.
  for (const item of preview.filter(item => item.eligible)) {
    await enqueue(client, platform, 'dm', item.id, message, `campaign:${campaignId}:${platform}:${item.id}`, new Date(Date.now() + 24 * 3600000));
  }
  return preview;
}

export async function handleIncomingMessages(client, entry, platform) {
  for (const event of entry.messaging || []) {
    if (!event.message?.mid || event.message.is_echo || !event.sender?.id ||
      String(event.recipient?.id) !== String(accountFor(client, platform))) continue;
    const timestamp = Number(event.timestamp);
    if (!Number.isFinite(timestamp) || timestamp > Date.now() + 60000 || timestamp <= 0) continue;
    const at = new Date(Math.min(timestamp, Date.now()));
    const recipient = String(event.sender.id);
    if (recipient === String(accountFor(client, platform))) continue;
    await query(`INSERT INTO messaging_contacts(client_id,platform,account_id,recipient_id,last_inbound_at)
      VALUES($1,$2,$3,$4,$5) ON CONFLICT(client_id,platform,account_id,recipient_id)
      DO UPDATE SET last_inbound_at=GREATEST(messaging_contacts.last_inbound_at,EXCLUDED.last_inbound_at)`,
    [client.id, platform, accountFor(client, platform), recipient, at]);
    if (isEligible(at)) await queueRules(client, platform, 'incoming', event.message.mid, recipient, event.message.text, at);
  }
}

export async function queueRules(client, platform, trigger, eventId, recipient, text, at = new Date()) {
  const { rows } = await query('SELECT * FROM messaging_rules WHERE client_id=$1 AND platform=$2 AND enabled=true ORDER BY created_at,id', [client.id, platform]);
  // One matching action per event: overlapping keywords cannot produce a burst of replies.
  const rule = rows.find(rule => (trigger === 'incoming' ? rule.kind === 'incoming' : rule.kind !== 'incoming') && matchesRule(rule, text));
  if (!rule) return;
  const kind = rule.kind === 'incoming' ? 'dm' : rule.kind;
  const key = createHash('sha256').update(`${platform}:${trigger}:${eventId}`).digest('hex');
  await enqueue(client, platform, kind, trigger === 'incoming' ? recipient : eventId, rule.message,
    `event:${key}`, new Date(new Date(at).getTime() + (kind === 'dm' ? 24 : 7 * 24) * 3600000));
}

export async function processQueue(clientId = null) {
  // Never automatically retry an interrupted send: Meta may already have delivered it.
  await query(`UPDATE messaging_jobs SET status='unknown',error='Delivery uncertain after interruption; check the conversation before sending again.',updated_at=now()
    WHERE status='sending' AND updated_at < now()-interval '5 minutes' AND ($1::text IS NULL OR client_id=$1)`, [clientId]);
  const results = [];
  for (let i = 0; i < 5; i++) {
    const { rows } = await query(`UPDATE messaging_jobs SET status='sending',updated_at=now() WHERE id=(
      SELECT id FROM messaging_jobs WHERE status='queued' AND ($1::text IS NULL OR client_id=$1)
      ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`, [clientId]);
    const job = rows[0];
    if (!job) break;
    let status = 'failed', error = null, providerId = null;
    try {
      const client = await clients.get(job.client_id);
      if (!client?.active || !tokenFor(client, job.platform) || String(accountFor(client, job.platform)) !== job.account_id) {
        throw new Error('Account paused, disconnected, or changed.');
      }
      if (new Date(job.expires_at).getTime() <= Date.now()) throw new Error('Reply window expired.');
      if (job.kind === 'dm') {
        const [recipient] = await recipientPreview(client, job.platform, [job.recipient_id]);
        if (!recipient.eligible) throw new Error(recipient.reason);
      }
      const ig = job.platform === 'instagram';
      const base = `https://graph.${ig ? 'instagram' : 'facebook'}.com/${process.env.MESSAGING_GRAPH_API_VERSION || 'v25.0'}`;
      let path, payload;
      if (job.kind === 'public') {
        path = `${job.recipient_id}/${ig ? 'replies' : 'comments'}`;
        payload = { message: job.message };
      } else if (job.kind === 'private' && !ig) {
        path = `${job.recipient_id}/private_replies`;
        payload = { message: job.message };
      } else {
        path = `${job.account_id}/messages`;
        payload = { recipient: job.kind === 'private' ? { comment_id: job.recipient_id } : { id: job.recipient_id }, message: { text: job.message } };
        if (!ig) payload.messaging_type = 'RESPONSE';
      }
      const { data } = await axios.post(`${base}/${path}`, payload, {
        headers: { Authorization: `Bearer ${tokenFor(client, job.platform)}` }, timeout: 8000,
      });
      providerId = data.message_id || data.id || null;
      status = 'sent';
    } catch (err) {
      // Only persist a short provider error, never request configuration or tokens.
      error = err.response?.data?.error?.message || (err.isAxiosError ? 'Network error; check the conversation before sending again.' : err.message);
      if (err.isAxiosError && !err.response) status = 'unknown';
    }
    await query('UPDATE messaging_jobs SET status=$2,error=$3,provider_id=$4,updated_at=now() WHERE id=$1', [job.id, status, String(error || '').slice(0, 500) || null, providerId]);
    results.push({ id: job.id, status });
  }
  return results;
}
