const { getSession } = require('../lib/session');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const session = getSession(req);
  res.json({ loggedIn: !!(session?.refreshToken) });
};
