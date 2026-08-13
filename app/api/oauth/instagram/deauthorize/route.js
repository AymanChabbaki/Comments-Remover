import { NextResponse } from 'next/server';
import * as clients from '../../../../../lib/clients';
import { parseSignedRequest } from '../../../../../lib/signedRequest';

export const runtime = 'nodejs';

/**
 * Meta calls this when a user removes the app's Instagram access from
 * their own account settings (not via our Settings page). We clear the
 * stored token so a removed connection doesn't linger as if still active.
 */
export async function POST(request) {
  const contentType = request.headers.get('content-type') || '';
  let signedRequest;
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    signedRequest = body.signed_request;
  } else {
    const form = await request.formData();
    signedRequest = form.get('signed_request');
  }

  if (!signedRequest) {
    return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 });
  }

  let payload;
  try {
    payload = parseSignedRequest(signedRequest, process.env.IG_APP_SECRET);
  } catch (err) {
    console.error('Instagram deauthorize: invalid signed_request:', err.message);
    return NextResponse.json({ error: 'Invalid signed_request' }, { status: 400 });
  }

  const igUserId = String(payload.user_id);
  const client = await clients.getByIgUserId(igUserId);
  if (client) {
    await clients.update(client.id, { igUserId: null, igAccessToken: null });
    console.log(`[${client.id}] Instagram deauthorized by user, cleared stored token`);
  }

  return NextResponse.json({ success: true });
}
