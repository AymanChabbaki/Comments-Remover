import { NextResponse } from 'next/server';
import * as clients from '../../../../lib/clients';

export const runtime = 'nodejs';
// Auth is handled by middleware.js (matches /api/admin/:path*) --
// requests reaching this handler have already passed admin Basic Auth.

export async function GET() {
  const list = await clients.list();
  // Never send raw tokens/password hashes back to the browser -- the
  // admin screen only needs to know a value is set, not what it is.
  const safe = list.map(({ pageAccessToken, igAccessToken, passwordHash, ...rest }) => ({
    ...rest,
    hasPageToken: !!pageAccessToken,
    hasIgToken: !!igAccessToken,
    hasLogin: !!passwordHash,
  }));
  return NextResponse.json({ clients: safe });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const client = await clients.create(body);
    return NextResponse.json({ success: true, client });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
