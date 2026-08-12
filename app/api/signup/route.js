import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as clients from '../../../lib/clients';
import { signClientToken, CLIENT_COOKIE, COOKIE_MAX_AGE } from '../../../lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  const { name, email, password, pageId, pageAccessToken, igUserId, igAccessToken } = await request.json();

  if (!name || !email || !password || !pageId || !pageAccessToken) {
    return NextResponse.json({ success: false, error: 'Name, email, password, Page ID, and Page Access Token are all required.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const client = await clients.create({
      name, email, passwordHash, pageId, pageAccessToken,
      igUserId: igUserId || undefined, igAccessToken: igAccessToken || undefined,
    });

    const res = NextResponse.json({ success: true, clientId: client.id });
    res.cookies.set(CLIENT_COOKIE, signClientToken(client.id), {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });
    return res;
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
