import { NextResponse } from 'next/server';
import * as blocklist from '../../../../../../lib/blocklist';
import { isAuthorizedForClient } from '../../../../../../lib/auth';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  const { clientId } = await params;
  if (!isAuthorizedForClient(request, clientId)) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { platform, authorId } = await request.json();
  if (!platform || !authorId) {
    return NextResponse.json({ success: false, error: 'platform and authorId are required' }, { status: 400 });
  }
  const existed = await blocklist.unblock(clientId, platform, authorId);
  return NextResponse.json({ success: existed });
}
