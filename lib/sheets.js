const { google }   = require('googleapis');
const { setSession, getSession } = require('./session');

function getClient(req, res) {
  const session = getSession(req);
  if (!session?.refreshToken) return null;

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BASE_URL}/api/auth/callback`
  );

  auth.setCredentials({
    access_token:  session.accessToken,
    refresh_token: session.refreshToken,
    expiry_date:   session.expiresAt,
  });

  auth.on('tokens', tokens => {
    const updated = {
      ...session,
      accessToken: tokens.access_token || session.accessToken,
      expiresAt:   tokens.expiry_date  || session.expiresAt,
    };
    setSession(res, updated);
    req._session = updated;
  });

  return auth;
}

module.exports = { getClient };
