const { auth } = require('../firebase');

/**
 * Verifies the Firebase ID token sent as "Authorization: Bearer <token>".
 * The role comes from the signed custom claim ("role"), which only the Admin SDK
 * can set, so it cannot be forged by the client.
 */
async function verifyToken(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }
  try {
    // 2nd argument = also reject tokens that were revoked (e.g. after a role change)
    const decoded = await auth.verifyIdToken(token, true);
    req.user = {
      uid: decoded.uid,
      email: decoded.email || '',
      role: decoded.role === 'admin' ? 'admin' : 'customer',
    };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Must run after verifyToken.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  return next();
}

module.exports = { verifyToken, requireAdmin };
