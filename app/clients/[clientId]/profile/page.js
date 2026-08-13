import { redirect, notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import * as clients from '../../../../lib/clients';
import { verifyClientToken, isAdminRequest, CLIENT_COOKIE } from '../../../../lib/auth';
import ProfileClient from './ProfileClient';

export default async function ClientProfilePage({ params }) {
  const { clientId } = await params;

  const client = await clients.get(clientId);
  if (!client) notFound();

  const cookieStore = await cookies();
  const headerList = await headers();
  const requestShim = { headers: { get: (name) => headerList.get(name) } };

  const authedClientId = verifyClientToken(cookieStore.get(CLIENT_COOKIE)?.value);
  const authorized = authedClientId === clientId || isAdminRequest(requestShim);

  if (!authorized) {
    redirect(`/login?next=${encodeURIComponent(`/clients/${clientId}/profile`)}`);
  }

  return <ProfileClient clientId={clientId} clientName={client.name} />;
}
