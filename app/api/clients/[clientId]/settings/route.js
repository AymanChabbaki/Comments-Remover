import { NextResponse } from 'next/server';
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

  // Never send raw tokens back to the browser -- the form only needs to
  // know whether a value is already set (to show "connected" state and
  // let a field be left blank to keep the current token unchanged).
  return NextResponse.json({
    name: client.name,
    pageId: client.pageId,
    hasPageToken: !!client.pageAccessToken,
    igUserId: client.igUserId,
    hasIgToken: !!client.igAccessToken,
  });
}

export async function PATCH(request, { params }) {
  const { clientId } = await params;
  if (!isAuthorizedForClient(request, clientId)) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  // Only these fields are client-editable -- name/email/active/password
  // are handled separately, not through this endpoint. Blank strings
  // mean "leave unchanged" for the tokens, since the client can't see
  // (and shouldn't need to retype) a token that's already saved.
  const fields = {};
  for (const key of ['pageId', 'pageAccessToken', 'igUserId', 'igAccessToken']) {
    if (typeof body[key] === 'string' && body[key].trim() !== '') {
      fields[key] = body[key].trim();
    }
  }

  try {
    const client = await clients.update(clientId, fields);
    if (!client) return NextResponse.json({ success: false, error: 'Unknown client' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
