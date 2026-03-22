const { clearSession } = require('../../lib/session');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  clearSession(res);
  res.redirect(302, '/');
};
