import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as clients from '../../../lib/clients';
import { signClientToken, CLIENT_COOKIE, COOKIE_MAX_AGE } from '../../../lib/auth';
import { isRateLimited, clearRateLimit, clientIp } from '../../../lib/rateLimit';

export const runtime = 'nodejs';

const IP_LIMIT = { max: 20, windowMs: 10 * 60 * 1000 }; // catches credential stuffing across many emails
const EMAIL_LIMIT = { max: 8, windowMs: 10 * 60 * 1000 }; // catches targeted brute force of one account

export async function POST(request) {
  const { email, password } = await request.json();
  const ip = clientIp(request);
  const emailKey = `email:${(email || '').toLowerCase()}`;

  if (isRateLimited(`ip:${ip}`, IP_LIMIT) || (email && isRateLimited(emailKey, EMAIL_LIMIT))) {
    return NextResponse.json({ success: false, error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }

  const client = email && (await clients.getByEmail(email));

  const ok = client?.passwordHash && (await bcrypt.compare(password || '', client.passwordHash));
  if (!ok) {
    return NextResponse.json({ success: false, error: 'Incorrect email or password.' }, { status: 401 });
  }
  clearRateLimit(`ip:${ip}`);
  clearRateLimit(emailKey);
  if (!client.active) {
    return NextResponse.json({ success: false, error: 'This account is paused. Contact support.' }, { status: 403 });
  }

  const connected = !!client.pageId && !!client.pageAccessToken;
  const res = NextResponse.json({ success: true, clientId: client.id, connected });
  res.cookies.set(CLIENT_COOKIE, signClientToken(client.id), {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return res;
}
