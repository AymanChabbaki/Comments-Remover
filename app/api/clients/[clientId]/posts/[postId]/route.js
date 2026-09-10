import { NextResponse } from 'next/server';
import * as clients from '../../../../../../lib/clients';
import { isAuthorizedForClient } from '../../../../../../lib/auth';
import { deleteFacebookPost } from '../../../../../../lib/socialPosts';

export const runtime = 'nodejs';

export async function DELETE(request, { params }) {
  const { clientId, postId } = await params;
  if (!isAuthorizedForClient(request, clientId)) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const client = await clients.get(clientId);
  if (!client) return NextResponse.json({ success: false, error: 'Unknown client' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  if (body.platform !== 'facebook') {
    return NextResponse.json({
      success: false,
      error: 'Instagram does not allow apps to delete published media. Open the post in Instagram to delete it.',
    }, { status: 409 });
  }
  if (!client.pageAccessToken) {
    return NextResponse.json({ success: false, error: 'Facebook is not connected' }, { status: 409 });
  }

  // A Page post ID starts with the connected Page ID. This prevents a
  // caller from submitting another Page's arbitrary object ID.
  if (!postId.startsWith(`${client.pageId}_`)) {
    return NextResponse.json({ success: false, error: 'This post does not belong to the connected Page' }, { status: 403 });
  }

  const result = await deleteFacebookPost(postId, client.pageAccessToken);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 502 });
  return NextResponse.json({ success: true });
}
