import { verifyAccessToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/index.js';

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
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(ApiError.unauthorized('Token expired'));
    next(err.isOperational ? err : ApiError.unauthorized('Invalid token'));
  }
};
