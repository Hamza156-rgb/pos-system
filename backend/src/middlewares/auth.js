import { verifyAccessToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/index.js';
import { runWithTenant } from '../utils/tenantContext.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or invalid Authorization header');
    }
    const token = header.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) throw ApiError.unauthorized('User not found or inactive');
    req.user = user;
    // Run the rest of the request inside this user's tenant context so all
    // model queries are automatically scoped (superadmin bypasses scoping).
    const store = { tenantId: user.TenantId, isSuperadmin: user.role === 'superadmin' };
    return runWithTenant(store, () => next());
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(ApiError.unauthorized('Token expired'));
    next(err.isOperational ? err : ApiError.unauthorized('Invalid token'));
  }
};
