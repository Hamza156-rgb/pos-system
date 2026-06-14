import ApiError from '../utils/ApiError.js';

// Usage: authorize('admin') or authorize('admin', 'cashier')
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};
