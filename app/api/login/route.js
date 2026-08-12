import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as clients from '../../../lib/clients';
import { signClientToken, CLIENT_COOKIE, COOKIE_MAX_AGE } from '../../../lib/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  const { email, password } = await request.json();
  const client = email && (await clients.getByEmail(email));

  const ok = client?.passwordHash && (await bcrypt.compare(password || '', client.passwordHash));
  if (!ok) {
    return NextResponse.json({ success: false, error: 'Incorrect email or password.' }, { status: 401 });
  }
  if (!client.active) {
    return NextResponse.json({ success: false, error: 'This account is paused. Contact support.' }, { status: 403 });
  }

  const res = NextResponse.json({ success: true, clientId: client.id });
  res.cookies.set(CLIENT_COOKIE, signClientToken(client.id), {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return res;
}
