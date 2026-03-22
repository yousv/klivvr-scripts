const crypto   = require('crypto');
const { google } = require('googleapis');

function makeOAuth2() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BASE_URL}/api/auth/callback`
  );
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const state = crypto.randomBytes(24).toString('base64url');
  const url   = makeOAuth2().generateAuthUrl({
    access_type: 'offline',
    prompt:      'consent',
    scope:       ['https://www.googleapis.com/auth/spreadsheets'],
    state,
  });
  res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  res.redirect(302, url);
};
