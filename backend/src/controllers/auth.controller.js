import { User, Tenant } from '../models/index.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import { logAudit } from '../middlewares/audit.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('Account is disabled');

  // Shop users: block login if their shop is suspended or expired.
  if (user.role !== 'superadmin') {
    const tenant = user.TenantId ? await Tenant.findByPk(user.TenantId) : null;
    if (!tenant) throw ApiError.forbidden('No shop is associated with this account');
    if (tenant.status === 'suspended') throw ApiError.forbidden('This shop has been suspended. Please contact support.');
    if (tenant.expiresAt && new Date(tenant.expiresAt) < new Date()) throw ApiError.forbidden('This shop subscription has expired.');
  }

  const payload = { id: user.id, role: user.role, name: user.name };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: user.id });
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();

  await logAudit({ userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, description: `${user.email} logged in`, ip: req.ip });
  ok(res, { user: user.toSafeJSON(), accessToken, refreshToken }, 'Login successful');
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw ApiError.badRequest('Refresh token required');
  let decoded;
  try { decoded = verifyRefreshToken(refreshToken); }
  catch { throw ApiError.unauthorized('Invalid refresh token'); }

  const user = await User.findByPk(decoded.id);
  if (!user || user.refreshToken !== refreshToken) throw ApiError.unauthorized('Refresh token revoked');

  const accessToken = signAccessToken({ id: user.id, role: user.role, name: user.name });
  ok(res, { accessToken }, 'Token refreshed');
});

export const logout = asyncHandler(async (req, res) => {
  req.user.refreshToken = null;
  await req.user.save();
  await logAudit({ userId: req.user.id, action: 'LOGOUT', entity: 'User', entityId: req.user.id, ip: req.ip });
  ok(res, null, 'Logged out');
});

export const me = asyncHandler(async (req, res) => {
  ok(res, req.user.toSafeJSON());
});
