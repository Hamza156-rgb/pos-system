import { User } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const users = await User.findAll({ order: [['createdAt', 'DESC']] });
  ok(res, users.map((u) => u.toSafeJSON()));
});

// Admins implicitly have full access, so we only store permissions for cashiers.
const normalizePermissions = (role, permissions) =>
  (role === 'admin' ? [] : (Array.isArray(permissions) ? permissions : []));

export const create = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, permissions } = req.body;
  const user = await User.create({
    name, email, password, role, phone, permissions: normalizePermissions(role, permissions),
  });
  created(res, user.toSafeJSON(), 'User created');
});

export const update = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  const { name, email, role, phone, isActive, password, permissions } = req.body;
  Object.assign(user, { name, email, role, phone, isActive });
  user.permissions = normalizePermissions(role ?? user.role, permissions ?? user.permissions);
  if (password) user.password = password;
  await user.save();
  ok(res, user.toSafeJSON(), 'User updated');
});

export const remove = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user.id === req.user.id) throw ApiError.badRequest('You cannot delete yourself');
  await user.destroy();
  ok(res, null, 'User deleted');
});
