import { sequelize, Tenant, User, Setting, Product, Sale } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const tenants = await Tenant.findAll({ order: [['createdAt', 'DESC']] });
  // Attach lightweight per-shop counts (superadmin context bypasses tenant scoping).
  const withCounts = await Promise.all(tenants.map(async (tn) => {
    const [users, products, sales] = await Promise.all([
      User.count({ where: { TenantId: tn.id } }),
      Product.count({ where: { TenantId: tn.id } }),
      Sale.count({ where: { TenantId: tn.id } }),
    ]);
    return { ...tn.toJSON(), counts: { users, products, sales } };
  }));
  ok(res, withCounts);
});

export const getOne = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findByPk(req.params.id);
  if (!tenant) throw ApiError.notFound('Shop not found');
  const admins = await User.findAll({ where: { TenantId: tenant.id, role: 'admin' } });
  ok(res, { ...tenant.toJSON(), admins: admins.map((a) => a.toSafeJSON()) });
});

export const create = asyncHandler(async (req, res) => {
  const {
    name, slug, contactName, contactPhone, contactEmail, plan, expiresAt,
    adminName, adminEmail, adminPassword,
  } = req.body;
  if (!name) throw ApiError.badRequest('Shop name is required');
  if (!adminEmail || !adminPassword) throw ApiError.badRequest('Admin email and password are required');

  const existing = await User.findOne({ where: { email: adminEmail } });
  if (existing) throw ApiError.conflict('A user with that admin email already exists');

  const result = await sequelize.transaction(async (t) => {
    const tenant = await Tenant.create(
      { name, slug: slug || null, contactName, contactPhone, contactEmail, plan: plan || 'trial', expiresAt: expiresAt || null },
      { transaction: t }
    );
    // Explicit TenantId — superadmin context bypasses the auto-stamp hook.
    const admin = await User.create(
      { name: adminName || 'Shop Admin', email: adminEmail, password: adminPassword, role: 'admin', TenantId: tenant.id, permissions: [] },
      { transaction: t }
    );
    await Setting.create(
      { shopName: name, currency: 'PKR', taxPercentage: 0, receiptTemplate: '80mm', TenantId: tenant.id },
      { transaction: t }
    );
    return { tenant, admin };
  });

  created(res, { tenant: result.tenant, admin: result.admin.toSafeJSON() }, 'Shop created');
});

export const update = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findByPk(req.params.id);
  if (!tenant) throw ApiError.notFound('Shop not found');
  const { name, slug, contactName, contactPhone, contactEmail, plan, status, expiresAt } = req.body;
  Object.assign(tenant, {
    name: name ?? tenant.name,
    slug: slug ?? tenant.slug,
    contactName: contactName ?? tenant.contactName,
    contactPhone: contactPhone ?? tenant.contactPhone,
    contactEmail: contactEmail ?? tenant.contactEmail,
    plan: plan ?? tenant.plan,
    status: status ?? tenant.status,
    expiresAt: expiresAt !== undefined ? expiresAt : tenant.expiresAt,
  });
  await tenant.save();
  ok(res, tenant, 'Shop updated');
});
