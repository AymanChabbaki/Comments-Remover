import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as clients from '../../../../../lib/clients';

export const runtime = 'nodejs';

function scrub({ pageAccessToken, igAccessToken, passwordHash, ...rest }) {
  return { ...rest, hasPageToken: !!pageAccessToken, hasIgToken: !!igAccessToken, hasLogin: !!passwordHash };
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    // "password" (plain) is accepted here as the admin's password-reset
    // action -- hashed before it ever reaches clients.update/the DB.
    // passwordHash itself is never accepted directly from the request
    // body -- only ever set via the bcrypt.hash below -- so a caller
    // can't plant an arbitrary pre-computed hash on someone's account.
    const { password, passwordHash: _ignored, ...rest } = body;
    if (password) {
      if (password.length < 8) {
        return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
      }
      rest.passwordHash = await bcrypt.hash(password, 10);
    }

    const client = await clients.update(id, rest);
    if (!client) return NextResponse.json({ success: false, error: 'Unknown client' }, { status: 404 });
    return NextResponse.json({ success: true, client: scrub(client) });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const existed = await clients.remove(id);
  return NextResponse.json({ success: existed });
}
