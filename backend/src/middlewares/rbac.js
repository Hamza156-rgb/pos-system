import ApiError from '../utils/ApiError.js';

// Usage: authorize('admin') or authorize('admin', 'cashier')
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

// Usage: requirePermission('reports')
// Admins always pass; cashiers must have the screen key in their permissions list.
export const requirePermission = (key) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role === 'admin') return next();
  const perms = Array.isArray(req.user.permissions) ? req.user.permissions : [];
  if (!perms.includes(key)) {
    return next(ApiError.forbidden('You do not have access to this section'));
  }
  next();
};
