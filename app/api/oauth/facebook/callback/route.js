import { NextResponse } from 'next/server';
import * as clients from '../../../../../lib/clients';
import { isAuthorizedForClient } from '../../../../../lib/auth';
import { exchangeCodeForUserToken, fetchPages, subscribePageToWebhooks } from '../../../../../lib/facebookAuth';

export const runtime = 'nodejs';

/**
 * Lands here after a client approves (or denies) the Facebook Login
 * consent screen started from Settings. `state` carries the clientId the
 * flow was started for -- re-checked against the caller's own
 * session/admin auth below so a tampered `state` can't attach a token to
 * someone else's account. Mirrors
 * app/api/oauth/instagram/callback/route.js.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error') || url.searchParams.get('error_reason');

  const settingsUrl = (status, reason) => {
    const dest = new URL(`/clients/${state}/settings`, url.origin);
    dest.searchParams.set('fb', status);
    if (reason) dest.searchParams.set('fb_reason', reason.slice(0, 300));
    return dest;
  };

  if (!state) return NextResponse.json({ error: 'Missing state' }, { status: 400 });
  if (!isAuthorizedForClient(request, state)) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/clients/${state}/settings`)}`, url.origin));
  }
  if (error || !code) {
    return NextResponse.redirect(settingsUrl('denied'));
  }

  try {
    const redirectUri = `${url.origin}/api/oauth/facebook/callback`;
    const userAccessToken = await exchangeCodeForUserToken({ code, redirectUri });

    const pages = await fetchPages(userAccessToken);
    if (pages.length === 0) {
      return NextResponse.redirect(settingsUrl('error', 'No Facebook Pages found for this account -- make sure you approved Page access on the consent screen.'));
    }
    // Most clients manage a single Page; connect the first one. Anyone
    // managing several can pick a different one via manual paste.
    const page = pages[0];

    await clients.update(state, { pageId: page.id, pageAccessToken: page.access_token });

    try {
      await subscribePageToWebhooks(page.id, page.access_token);
    } catch (subErr) {
      // Token is saved either way -- log and still report success; worst
      // case the Page isn't receiving events yet, fixable by re-running
      // the manual curl command from the README.
      console.error('Facebook Page webhook subscribe failed:', subErr.response?.data || subErr.message);
    }

    return NextResponse.redirect(settingsUrl('connected'));
  } catch (err) {
    const apiError = err.response?.data?.error?.message || err.response?.data;
    const reason = apiError ? (typeof apiError === 'string' ? apiError : JSON.stringify(apiError)) : err.message;
    console.error('Facebook OAuth exchange failed:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });
    return NextResponse.redirect(settingsUrl('error', reason));
  }
}
