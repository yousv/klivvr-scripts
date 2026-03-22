const { google } = require('googleapis');
const { getSession, setSession } = require('./session');

function makeOAuth2() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BASE_URL}/api/auth/callback`
  );
}

async function getClient(req, res) {
  const session = getSession(req);
  if (!session?.refreshToken) return null;

  const auth = makeOAuth2();
  auth.setCredentials({
    access_token:  session.accessToken,
    refresh_token: session.refreshToken,
    expiry_date:   session.expiresAt,
  });

  if (!session.expiresAt || Date.now() > session.expiresAt - 60_000) {
    try {
      const { credentials } = await auth.refreshAccessToken();
      const updated = {
        ...session,
        accessToken: credentials.access_token,
        expiresAt:   credentials.expiry_date,
      };
      setSession(res, updated);
      auth.setCredentials(credentials);
    } catch (e) {
      console.error('Token refresh failed:', e.message);
      return null;
    }
  }

  return auth;
}

module.exports = { makeOAuth2, getClient };
