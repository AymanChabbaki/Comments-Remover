import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { isAuthorizedForClient } from '../../../../../lib/auth';
import * as clients from '../../../../../lib/clients';
import { query } from '../../../../../lib/db';
import { accountFor, tokenFor, recipientPreview, queueCampaign, processQueue } from '../../../../../lib/messaging';
import { parseRecipients, validateMessage } from '../../../../../lib/messagingPolicy';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function authorize(request, params) {
  const { clientId } = await params;
  if (!isAuthorizedForClient(request, clientId)) return { response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  const client = await clients.get(clientId);
  if (!client) return { response: NextResponse.json({ error: 'Unknown client' }, { status: 404 }) };
  return { client };
}

export async function GET(request, { params }) {
  const { client, response } = await authorize(request, params);
  if (response) return response;
  const [rules, jobs, contacts, pending] = await Promise.all([
    query('SELECT * FROM messaging_rules WHERE client_id=$1 ORDER BY created_at,id', [client.id]),
    query('SELECT * FROM messaging_jobs WHERE client_id=$1 ORDER BY created_at DESC LIMIT 100', [client.id]),
    query(`SELECT platform,recipient_id,last_inbound_at FROM messaging_contacts WHERE client_id=$1
      AND ((platform='facebook' AND account_id=$2) OR (platform='instagram' AND account_id=$3))
      ORDER BY last_inbound_at DESC LIMIT 500`, [client.id, client.pageId, client.igUserId]),
    query("SELECT count(*)::int AS count FROM messaging_jobs WHERE client_id=$1 AND status='queued'", [client.id]),
  ]);
  return NextResponse.json({ rules: rules.rows, jobs: jobs.rows, contacts: contacts.rows, pending: pending.rows[0].count,
    connected: { facebook: !!(client.pageId && client.pageAccessToken), instagram: !!(client.igUserId && client.igAccessToken) }, active: client.active });
}

export async function POST(request, { params }) {
  const { client, response } = await authorize(request, params);
  if (response) return response;
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  try {
    const body = await request.json();
    if (body.action === 'cancel') {
      await query("UPDATE messaging_jobs SET status='cancelled',updated_at=now() WHERE client_id=$1 AND status='queued'", [client.id]);
      return NextResponse.json({ success: true });
    }
    if (body.action === 'deleteRule') {
      await query('DELETE FROM messaging_rules WHERE id=$1 AND client_id=$2', [body.id, client.id]);
      return NextResponse.json({ success: true });
    }
    if (!client.active) throw new Error('This account is paused.');
    if (body.action === 'process') return NextResponse.json({ results: await processQueue(client.id) });
    const platform = body.platform;
    if (!['facebook', 'instagram'].includes(platform)) throw new Error('Choose Facebook or Instagram.');
    if (!accountFor(client, platform) || !tokenFor(client, platform)) throw new Error('Connect this account in Settings first.');
    if (body.action === 'saveRule') {
      if (!['public', 'private', 'incoming'].includes(body.kind)) throw new Error('Choose a reply type.');
      if (typeof body.keyword !== 'string' || body.keyword.length > 100) throw new Error('Use a keyword up to 100 characters.');
      const message = validateMessage(body.message);
      await query(`INSERT INTO messaging_rules(id,client_id,platform,kind,keyword,message,enabled) VALUES($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT(id) DO UPDATE SET platform=EXCLUDED.platform,kind=EXCLUDED.kind,keyword=EXCLUDED.keyword,message=EXCLUDED.message,enabled=EXCLUDED.enabled
        WHERE messaging_rules.client_id=EXCLUDED.client_id`,
      [body.id || randomUUID(), client.id, platform, body.kind, body.keyword.trim(), message, body.enabled === true]);
      return NextResponse.json({ success: true });
    }
    const ids = parseRecipients(body.recipients);
    if (body.action === 'preview') return NextResponse.json({ recipients: await recipientPreview(client, platform, ids) });
    if (body.action === 'send') {
      if (typeof body.campaignId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(body.campaignId)) throw new Error('Missing request ID. Refresh the page.');
      const message = validateMessage(body.message);
      return NextResponse.json({ recipients: await queueCampaign(client, platform, ids, message, body.campaignId) });
    }
    throw new Error('Unknown action.');
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
