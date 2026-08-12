import axios from 'axios';

/**
 * Server-side half of the Facebook Login OAuth handshake used for the
 * "Connect Facebook" button. Mirrors lib/instagramAuth.js's flow: the
 * client only ever sees the public authorize URL (built in the browser,
 * see SettingsClient.jsx) -- exchanging the resulting `code` for a real
 * token happens here, using FB_APP_SECRET, so the secret never reaches
 * the browser.
 */
async function exchangeCodeForUserToken({ code, redirectUri }) {
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (!appId || !appSecret) {
    const missing = [!appId && 'FB_APP_ID', !appSecret && 'FB_APP_SECRET'].filter(Boolean).join(', ');
    throw new Error(`Missing env var(s) on this deployment: ${missing}`);
  }
  const version = process.env.GRAPH_API_VERSION || 'v19.0';

  const shortLived = await axios.get(`https://graph.facebook.com/${version}/oauth/access_token`, {
    params: { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code },
  });

  // Exchange for a long-lived user token (~60 days) -- Page tokens
  // derived from it below inherit that lifetime instead of expiring
  // in ~1-2 hours with the short-lived one.
  const longLived = await axios.get(`https://graph.facebook.com/${version}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLived.data.access_token,
    },
  });

  return longLived.data.access_token;
}

/**
 * Lists the Pages the authorizing user manages, each with its own Page
 * access token (long-lived when derived from a long-lived user token, as
 * above). Most clients manage a single Page -- the callback route
 * connects the first one returned; anyone managing several can still
 * fall back to the manual paste fields for a different Page.
 */
async function fetchPages(userAccessToken) {
  const version = process.env.GRAPH_API_VERSION || 'v19.0';
  const { data } = await axios.get(`https://graph.facebook.com/${version}/me/accounts`, {
    params: { access_token: userAccessToken },
  });
  return data.data || [];
}

/**
 * Subscribes the Page to comment webhooks -- the API equivalent of the
 * manual curl command in the README. Doesn't throw: a failure here
 * shouldn't undo the token we just saved, just leaves the Page
 * unsubscribed (fixable by re-running the manual curl command).
 */
async function subscribePageToWebhooks(pageId, pageAccessToken) {
  const version = process.env.GRAPH_API_VERSION || 'v19.0';
  await axios.post(`https://graph.facebook.com/${version}/${pageId}/subscribed_apps`, null, {
    params: { subscribed_fields: 'feed', access_token: pageAccessToken },
  });
}

export { exchangeCodeForUserToken, fetchPages, subscribePageToWebhooks };
