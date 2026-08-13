import { redirect, notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import * as clients from '../../../../lib/clients';
import { verifyClientToken, isAdminRequest, CLIENT_COOKIE } from '../../../../lib/auth';
import CommentsClient from './CommentsClient';

export async function generateMetadata({ params }) {
  const { clientId } = await params;
  const client = await clients.get(clientId);
  return {
    title: client ? `Comments — ${client.name}` : 'Comments',
    robots: { index: false, follow: false },
  };
}

export default async function ClientCommentsPage({ params }) {
  const { clientId } = await params;

  const client = await clients.get(clientId);
  if (!client) notFound();

  const cookieStore = await cookies();
  const headerList = await headers();
  const requestShim = { headers: { get: (name) => headerList.get(name) } };

  const authedClientId = verifyClientToken(cookieStore.get(CLIENT_COOKIE)?.value);
  const authorized = authedClientId === clientId || isAdminRequest(requestShim);

  if (!authorized) {
    redirect(`/login?next=${encodeURIComponent(`/clients/${clientId}/comments`)}`);
  }

  if (authedClientId === clientId && !(client.pageId && client.pageAccessToken)) {
    redirect(`/clients/${clientId}/onboarding`);
  }

  return <CommentsClient clientId={clientId} clientName={client.name} />;
}
