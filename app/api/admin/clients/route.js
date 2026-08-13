import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as clients from '../../../../lib/clients';

export const runtime = 'nodejs';
// Auth is handled by proxy.js (matches /api/admin/:path*) -- requests
// reaching this handler have already passed admin Basic Auth.

function scrub({ pageAccessToken, igAccessToken, passwordHash, ...rest }) {
  return { ...rest, hasPageToken: !!pageAccessToken, hasIgToken: !!igAccessToken, hasLogin: !!passwordHash };
}

export async function GET() {
  const list = await clients.list();
  return NextResponse.json({ clients: list.map(scrub) });
}

/**
 * Creates a client. In the common case this is just an account shell --
 * name/email/password -- with no Page/Instagram credentials at all: the
 * point is that whoever runs this admin screen can create a login and
 * hand it to the client without ever touching their Graph API tokens
 * themselves. The client fills those in later from their own dashboard's
 * Settings page. pageId/pageAccessToken can still be passed here too, if
 * you'd rather enter them directly for a given client.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { password, passwordHash: _ignored, ...rest } = body;
    if (rest.email && !password) {
      return NextResponse.json({ success: false, error: 'A password is required when setting an email (the client needs it to log in).' }, { status: 400 });
    }
    // Enforced here too, not just in the admin form's `minLength` -- an
    // HTML attribute doesn't stop a direct API call.
    if (password && password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
    const client = await clients.create({ ...rest, passwordHash });
    return NextResponse.json({ success: true, client: scrub(client) });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
