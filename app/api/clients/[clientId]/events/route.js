import { NextResponse } from 'next/server';
import * as eventLog from '../../../../../lib/eventLog';
import * as clients from '../../../../../lib/clients';
import { isAuthorizedForClient } from '../../../../../lib/auth';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const { clientId } = await params;

  if (!isAuthorizedForClient(request, clientId)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const client = await clients.get(clientId);
  if (!client) return NextResponse.json({ error: 'Unknown client' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit'), 10) || 300, 1000);

  const [stats, events] = await Promise.all([eventLog.stats(clientId), eventLog.list(clientId, limit)]);
  return NextResponse.json({ stats, events });
}
