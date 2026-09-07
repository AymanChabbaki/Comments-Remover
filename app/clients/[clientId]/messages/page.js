import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { isAuthorizedForClient } from '../../../../lib/auth';
import * as clients from '../../../../lib/clients';
import MessagesClient from './MessagesClient';

export const metadata = { title: 'Auto Messages', robots: { index: false, follow: false } };
export default async function MessagesPage({ params }) {
  const { clientId } = await params;
  if (!isAuthorizedForClient({ headers: await headers() }, clientId)) redirect(`/login?next=${encodeURIComponent(`/clients/${clientId}/messages`)}`);
  const client = await clients.get(clientId);
  if (!client) notFound();
  return <MessagesClient clientId={client.id} clientName={client.name} />;
}
