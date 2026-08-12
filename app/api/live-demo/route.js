import { NextResponse } from 'next/server';
import * as clients from '../../../lib/clients';
import * as eventLog from '../../../lib/eventLog';
import * as blocklist from '../../../lib/blocklist';

export const runtime = 'nodejs';

/**
 * Public, unauthenticated, read-only view of one real connected client's
 * moderation activity -- powers /live-demo, so a prospect can post a
 * comment on our own Page and watch the real pipeline handle it, instead
 * of the fake canned data on /demo. LIVE_DEMO_CLIENT_ID picks which
 * client; deliberately no mutation here (no delete/unblock), since this
 * is reachable by anyone with the link.
 */
export async function GET() {
  const clientId = process.env.LIVE_DEMO_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: 'Live demo not configured' }, { status: 404 });

  const client = await clients.get(clientId);
  if (!client) return NextResponse.json({ error: 'Live demo not configured' }, { status: 404 });

  const [stats, events, blocked] = await Promise.all([
    eventLog.stats(clientId),
    eventLog.list(clientId, 100),
    blocklist.list(clientId),
  ]);
  return NextResponse.json({ clientName: client.name, stats, events, blocked });
}
