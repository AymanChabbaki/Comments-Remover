import { NextResponse } from 'next/server';
import * as clients from '../../../../../lib/clients';
import { isAuthorizedForClient } from '../../../../../lib/auth';
import { exchangeCodeForLongLivedToken, fetchProfile, subscribeToWebhooks } from '../../../../../lib/instagramAuth';

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

  const settingsUrl = (status, reason) => {
    const dest = new URL(`/clients/${state}/settings`, url.origin);
    dest.searchParams.set('ig', status);
    if (reason) dest.searchParams.set('ig_reason', reason.slice(0, 300));
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
    const redirectUri = `${url.origin}/api/oauth/instagram/callback`;
    // userId here is from the short-lived token exchange -- kept only as
    // a fallback below, since it's not reliably the same ID format the
    // rest of the Graph API expects (see fetchProfile's comment).
    const { userId: fallbackUserId, accessToken } = await exchangeCodeForLongLivedToken({ code, redirectUri });

    let igUserId = fallbackUserId;
    let profile = {};
    try {
      const { userId: authoritativeUserId, username, profilePicUrl } = await fetchProfile(accessToken);
      igUserId = authoritativeUserId;
      profile = { igUsername: username, igProfilePicUrl: profilePicUrl };
    } catch (profileErr) {
      // Non-fatal -- the token is still valid and usable for moderation
      // even if the profile fields fail to fetch for some reason.
      console.error('Instagram profile fetch failed:', profileErr.response?.data || profileErr.message);
    }

    await clients.update(state, { igUserId, igAccessToken: accessToken, ...profile });

    try {
      await subscribeToWebhooks(accessToken);
    } catch (subErr) {
      // Token is saved either way (fixable by flipping the "Abonnement
      // Webhooks" toggle manually in App Dashboard, or reconnecting) --
      // but this means comments won't actually be moderated yet, so say
      // so instead of silently reporting a clean "connected" success.
      const apiError = subErr.response?.data?.error?.message || subErr.response?.data;
      const reason = apiError ? (typeof apiError === 'string' ? apiError : JSON.stringify(apiError)) : subErr.message;
      console.error('Instagram webhook subscribe failed:', subErr.response?.data || subErr.message);
      return NextResponse.redirect(settingsUrl('connected_no_webhook', reason));
    }

    return NextResponse.redirect(settingsUrl('connected'));
  } catch (err) {
    const apiError = err.response?.data?.error_message || err.response?.data?.error?.message || err.response?.data;
    const reason = apiError ? (typeof apiError === 'string' ? apiError : JSON.stringify(apiError)) : err.message;
    console.error('Instagram OAuth exchange failed:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
    });
    return NextResponse.redirect(settingsUrl('error', reason));
  }
}
