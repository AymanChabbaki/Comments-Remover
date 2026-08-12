import { NextResponse } from 'next/server';
import * as clients from '../../../../../lib/clients';
import { isAuthorizedForClient } from '../../../../../lib/auth';
import { exchangeCodeForLongLivedToken, subscribeToWebhooks } from '../../../../../lib/instagramAuth';

export const runtime = 'nodejs';

/**
 * Lands here after a client approves (or denies) the Instagram consent
 * screen started from Settings. `state` carries the clientId the flow was
 * started for -- re-checked against the caller's own session/admin auth
 * below so a tampered `state` can't attach a token to someone else's
 * account.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error') || url.searchParams.get('error_reason');

  const settingsUrl = (status) => new URL(`/clients/${state}/settings?ig=${status}`, url.origin);

  if (!state) return NextResponse.json({ error: 'Missing state' }, { status: 400 });
  if (!isAuthorizedForClient(request, state)) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/clients/${state}/settings`)}`, url.origin));
  }
  if (error || !code) {
    return NextResponse.redirect(settingsUrl('denied'));
  }

  try {
    const redirectUri = `${url.origin}/api/oauth/instagram/callback`;
    const { userId, accessToken } = await exchangeCodeForLongLivedToken({ code, redirectUri });
    await clients.update(state, { igUserId: userId, igAccessToken: accessToken });

    try {
      await subscribeToWebhooks(userId, accessToken);
    } catch (subErr) {
      // Token is saved either way -- log and still report success; worst
      // case the account isn't receiving events yet, fixable by flipping
      // the "Abonnement Webhooks" toggle manually in App Dashboard.
      console.error('Instagram webhook subscribe failed:', subErr.response?.data || subErr.message);
    }

    return NextResponse.redirect(settingsUrl('connected'));
  } catch (err) {
    console.error('Instagram OAuth exchange failed:', err.response?.data || err.message);
    return NextResponse.redirect(settingsUrl('error'));
  }
}
