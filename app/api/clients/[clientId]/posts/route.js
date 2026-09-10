import { NextResponse } from 'next/server';
import * as clients from '../../../../../lib/clients';
import { isAuthorizedForClient } from '../../../../../lib/auth';
import { listFacebookPosts, listInstagramPosts } from '../../../../../lib/socialPosts';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const { clientId } = await params;
  if (!isAuthorizedForClient(request, clientId)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const client = await clients.get(clientId);
  if (!client) return NextResponse.json({ error: 'Unknown client' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const after = searchParams.get('after') || null;
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit'), 10) || 50, 1), 100);

  try {
    if (platform === 'instagram') {
      if (!client.igAccessToken) return NextResponse.json({ error: 'Instagram is not connected' }, { status: 409 });
      return NextResponse.json(await listInstagramPosts({ accessToken: client.igAccessToken, after, limit }));
    }
    if (platform === 'facebook') {
      if (!client.pageId || !client.pageAccessToken) {
        return NextResponse.json({ error: 'Facebook is not connected' }, { status: 409 });
      }
      return NextResponse.json(await listFacebookPosts({
        pageId: client.pageId,
        accessToken: client.pageAccessToken,
        after,
        limit,
      }));
    }
    return NextResponse.json({ error: 'platform must be instagram or facebook' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not load posts from Meta' }, { status: 502 });
  }
}
