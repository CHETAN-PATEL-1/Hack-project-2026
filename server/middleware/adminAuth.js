const jwt = require('jsonwebtoken');

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-dev-secret-change';
const COOKIE_NAME = 'adminToken';

function adminAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ message: 'Admin login required' });
  try {
    const payload = jwt.verify(token, ADMIN_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    req.admin = true;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired admin session' });
  }
}

adminAuth.COOKIE_NAME = COOKIE_NAME;
adminAuth.ADMIN_SECRET = ADMIN_SECRET;
module.exports = adminAuth;
