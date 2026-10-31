const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'opsloop_jwt_secret_dev_key_2026';

/**
 * Middleware: Verify JWT Bearer Token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No bearer token provided.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired authentication token.'
      });
    }
    req.user = user;
    next();
  });
}

/**
 * Middleware: Authorize specific roles (e.g. ['graduate'], ['business_owner'])
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    const userRole = req.user.role;
    const hasRole = allowedRoles.includes(userRole) || userRole === 'admin';

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Role '${userRole}' is not authorized to access this resource. Allowed roles: [${allowedRoles.join(', ')}]`,
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole
};
