import { redirect, notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import * as clients from '../../../../lib/clients';
import { verifyClientToken, isAdminRequest, CLIENT_COOKIE } from '../../../../lib/auth';
import DashboardClient from './DashboardClient';

export default async function ClientDashboardPage({ params }) {
  const { clientId } = await params;

  const client = await clients.get(clientId);
  if (!client) notFound();

  const cookieStore = await cookies();
  const headerList = await headers();
  const requestShim = { headers: { get: (name) => headerList.get(name) } };

  const authedClientId = verifyClientToken(cookieStore.get(CLIENT_COOKIE)?.value);
  const authorized = authedClientId === clientId || isAdminRequest(requestShim);

  if (!authorized) {
    redirect(`/login?next=${encodeURIComponent(`/clients/${clientId}/dashboard`)}`);
  }

  // Own login (not the admin support fallback) and not connected yet --
  // send them back to the onboarding wizard instead of the empty
  // dashboard. Typing this URL directly shouldn't be a way around it.
  if (authedClientId === clientId && !(client.pageId && client.pageAccessToken)) {
    redirect(`/clients/${clientId}/onboarding`);
  }

  return <DashboardClient clientId={clientId} clientName={client.name} />;
}
