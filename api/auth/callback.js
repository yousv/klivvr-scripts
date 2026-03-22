const { makeOAuth2 } = require('../../lib/sheets');
const { setSession, parseCookies } = require('../../lib/session');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { code, state, error } = req.query;
  const savedState = parseCookies(req).oauth_state;

  if (error || !code || !state || !savedState || state !== savedState) {
    return res.redirect(302, '/?auth_error=1');
  }

  try {
    const auth = makeOAuth2();
    const { tokens } = await auth.getToken(code);

    if (!tokens.refresh_token) {
      return res.redirect(302, '/api/auth/login');
    }

    setSession(res, {
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt:    tokens.expiry_date,
    });

    res.setHeader('Set-Cookie', [
      res.getHeader('Set-Cookie'),
      'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    ].flat().filter(Boolean));

    res.redirect(302, '/');
  } catch (e) {
    console.error('OAuth error:', e.message);
    res.redirect(302, '/?auth_error=1');
  }
};
