import { redirect, notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import * as clients from '../../../../lib/clients';
import { verifyClientToken, isAdminRequest, CLIENT_COOKIE } from '../../../../lib/auth';
import PostsClient from './PostsClient';

export async function generateMetadata({ params }) {
  const { clientId } = await params;
  const client = await clients.get(clientId);
  return {
    title: client ? `Posts — ${client.name}` : 'Posts',
    robots: { index: false, follow: false },
  };
}

export default async function ClientPostsPage({ params }) {
  const { clientId } = await params;
  const client = await clients.get(clientId);
  if (!client) notFound();

  const cookieStore = await cookies();
  const headerList = await headers();
  const requestShim = { headers: { get: (name) => headerList.get(name) } };
  const authedClientId = verifyClientToken(cookieStore.get(CLIENT_COOKIE)?.value);
  const authorized = authedClientId === clientId || isAdminRequest(requestShim);

  if (!authorized) redirect(`/login?next=${encodeURIComponent(`/clients/${clientId}/posts`)}`);

  const connected = {
    facebook: !!(client.pageId && client.pageAccessToken),
    instagram: !!(client.igUserId && client.igAccessToken),
  };
  if (authedClientId === clientId && !connected.facebook && !connected.instagram) {
    redirect(`/clients/${clientId}/onboarding`);
  }

  return <PostsClient clientId={clientId} clientName={client.name} connected={connected} />;
}
