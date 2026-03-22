const crypto = require('crypto');

const COOKIE = 'ks_sess';
const OPTS   = 'HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000';

function key() {
  return crypto.createHash('sha256').update(process.env.COOKIE_SECRET || 'dev-secret-change-me').digest();
}

function encrypt(obj) {
  const iv  = crypto.randomBytes(12);
  const c   = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  const tag = c.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

function decrypt(s) {
  try {
    const b  = Buffer.from(s, 'base64url');
    const iv = b.subarray(0, 12), tag = b.subarray(12, 28), enc = b.subarray(28);
    const d  = crypto.createDecipheriv('aes-256-gcm', key(), iv);
    d.setAuthTag(tag);
    return JSON.parse(d.update(enc) + d.final('utf8'));
  } catch { return null; }
}

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '').split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    }).filter(([k]) => k)
  );
}

function getSession(req) {
  if (req._session !== undefined) return req._session;
  const raw = parseCookies(req)[COOKIE];
  req._session = raw ? decrypt(raw) : null;
  return req._session;
}

function setSession(res, session) {
  const existing = res.getHeader('Set-Cookie');
  const next = `${COOKIE}=${encrypt(session)}; ${OPTS}`;
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, next]);
  } else if (existing) {
    res.setHeader('Set-Cookie', [existing, next]);
  } else {
    res.setHeader('Set-Cookie', next);
  }
}

function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}

module.exports = { getSession, setSession, clearSession, parseCookies };
