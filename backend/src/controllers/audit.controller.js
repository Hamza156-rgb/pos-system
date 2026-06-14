import { AuditLog, User } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { paginated } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, action } = req.query;
  const where = action ? { action } : {};
  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['id', 'name', 'email'] }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });
  paginated(res, { rows, count, page, limit });
});
