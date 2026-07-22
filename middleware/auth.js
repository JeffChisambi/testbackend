const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/responseHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'c2e8a1d7f4b3e6a9d2c5f8b1e4a7d0c3f6b9e2a5d8c1f4b7e0a3d6c9f2b5e8a1';

/**
 * Authenticate JWT Token from Header or Cookies
 */
const authenticate = (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return sendError(res, 'Access denied. Authentication token required.', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired authorization token.', 401);
  }
};

/**
 * Authorize Role-Based Access Control (RBAC)
 * Valid roles: admin, registration_officer, extension_officer, marketing_officer, warehouse_officer, ipc_manager, headoffice_manager
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 'User identity not authenticated.', 401);
    }

    if (req.user.role === 'admin') {
      // System Administrator has superuser access
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res, 
        `Access denied. Role '${req.user.role}' is not authorized to access this resource. Required roles: ${allowedRoles.join(', ')}`, 
        403
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
