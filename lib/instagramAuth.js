import axios from 'axios';

/**
 * Server-side half of the Instagram OAuth handshake ("Instagram API with
 * Instagram Login"). The client only ever sees the public authorize URL
 * (built in the browser, see SettingsClient.jsx) -- exchanging the
 * resulting `code` for a real access token happens here, using
 * IG_APP_SECRET, so the secret never reaches the browser.
 */
async function exchangeCodeForLongLivedToken({ code, redirectUri }) {
  const appId = process.env.IG_APP_ID;
  const appSecret = process.env.IG_APP_SECRET;
  if (!appId || !appSecret) {
    const missing = [!appId && 'IG_APP_ID', !appSecret && 'IG_APP_SECRET'].filter(Boolean).join(', ');
    throw new Error(`Missing env var(s) on this deployment: ${missing}`);
  }

  const shortLived = await axios.post(
    'https://api.instagram.com/oauth/access_token',
    new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const { access_token: shortToken, user_id: userId } = shortLived.data;

  // Short-lived token is valid for ~1 hour; exchange it for a long-lived
  // one (~60 days) so the client doesn't have to reconnect constantly.
  const longLived = await axios.get('https://graph.instagram.com/access_token', {
    params: {
      grant_type: 'ig_exchange_token',
      client_secret: appSecret,
      access_token: shortToken,
    },
  });

  return { userId: String(userId), accessToken: longLived.data.access_token };
}

/**
 * Fetches the connected account's basic profile info (username, avatar),
 * plus the account's Graph-API-native `user_id`.
 *
 * That last part matters more than it looks: the `user_id` returned by
 * the short-lived token exchange above is not reliably the same ID format
 * graph.instagram.com expects elsewhere (a known rough edge of this
 * product) -- calling `/{that-id}/subscribed_apps` can 400 with
 * "Object with ID ... does not exist" even though the token is fine. `/me`
 * always resolves correctly from the token itself regardless of which ID
 * space is at play, so this is the authoritative ID to both act on (see
 * subscribeToWebhooks below) and store as igUserId -- it's also what
 * should actually match the ID Meta sends back in webhook payloads.
 */
async function fetchProfile(accessToken) {
  const version = process.env.GRAPH_API_VERSION || 'v19.0';
  const { data } = await axios.get(`https://graph.instagram.com/${version}/me`, {
    params: { fields: 'user_id,username,profile_picture_url', access_token: accessToken },
  });
  return { userId: String(data.user_id), username: data.username, profilePicUrl: data.profile_picture_url };
}

/**
 * Subscribes the account to comment webhooks -- the API equivalent of the
 * "Abonnement Webhooks" toggle on the App Dashboard's manual token page.
 * Called right after a client connects via OAuth so the whole flow is
 * genuinely one-click, no dashboard toggle required. Doesn't throw: a
 * failure here shouldn't undo the token we just saved, just leaves the
 * account unsubscribed (safe to retry manually from the dashboard toggle).
 * Targets `/me` rather than a literal ID -- see fetchProfile's comment on
 * why a literal ID here can spuriously 400.
 */
async function subscribeToWebhooks(accessToken) {
  const version = process.env.GRAPH_API_VERSION || 'v19.0';
  await axios.post(`https://graph.instagram.com/${version}/me/subscribed_apps`, null, {
    params: { subscribed_fields: 'comments', access_token: accessToken },
  });
}

export { exchangeCodeForLongLivedToken, fetchProfile, subscribeToWebhooks };
