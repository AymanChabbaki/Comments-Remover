import { NextResponse } from 'next/server';
import * as blocklist from '../../../../../lib/blocklist';
import { isAuthorizedForClient } from '../../../../../lib/auth';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const { clientId } = await params;
  if (!isAuthorizedForClient(request, clientId)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ blocked: await blocklist.list(clientId) });
}
