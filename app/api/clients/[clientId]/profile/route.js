import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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

  return NextResponse.json({ name: client.name, email: client.email });
}

export async function PATCH(request, { params }) {
  const { clientId } = await params;
  if (!isAuthorizedForClient(request, clientId)) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const fields = {};

  if (typeof body.name === 'string' && body.name.trim() !== '') {
    fields.name = body.name.trim();
  }
  if (typeof body.email === 'string' && body.email.trim() !== '') {
    fields.email = body.email.trim();
  }

  // Changing the password requires proving you know the current one --
  // unlike the admin's blind reset from /admin, this is self-service, so
  // there's no other check standing between "have the session cookie" and
  // "can permanently lock out the real owner."
  if (typeof body.newPassword === 'string' && body.newPassword !== '') {
    if (body.newPassword.length < 8) {
      return NextResponse.json({ success: false, error: 'New password must be at least 8 characters.' }, { status: 400 });
    }
    const client = await clients.get(clientId);
    const currentOk = client?.passwordHash && (await bcrypt.compare(body.currentPassword || '', client.passwordHash));
    if (!currentOk) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect.' }, { status: 400 });
    }
    fields.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  try {
    const client = await clients.update(clientId, fields);
    if (!client) return NextResponse.json({ success: false, error: 'Unknown client' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
