import dotenv from 'dotenv';
import { Op } from 'sequelize';
import {
  sequelize, Tenant, User, Category, Product, Supplier, Customer, Setting,
  Purchase, PurchaseItem, Sale, SaleItem, InventoryMovement, AuditLog,
  SaleReturn, SaleReturnItem, PurchaseReturn, PurchaseReturnItem, SupplierPayment, CustomerPayment,
} from './models/index.js';
import logger from './utils/logger.js';
import { runWithTenant } from './utils/tenantContext.js';

dotenv.config();

const SUPERADMIN = { name: 'Platform Owner', email: 'superadmin@pos.com', password: 'super123', role: 'superadmin' };

// Ensure the platform super-admin exists (created outside any tenant).
const ensureSuperadmin = async () => {
  const existing = await User.findOne({ where: { email: SUPERADMIN.email } });
  if (existing) return existing;
  return User.create({ ...SUPERADMIN, TenantId: null });
};

// One-time migration for an existing single-tenant database: create a Default Shop,
// move all orphaned (TenantId IS NULL) rows into it, and ensure a super-admin exists.
export const runTenantMigration = async () => {
  await ensureSuperadmin();
  let tenant = await Tenant.findOne({ where: { slug: 'default-shop' } });
  if (!tenant) tenant = await Tenant.create({ name: 'Default Shop', slug: 'default-shop', plan: 'pro', status: 'active' });

  const scoped = [
    User, Category, Product, Supplier, Customer, Purchase, PurchaseItem, Sale, SaleItem,
    InventoryMovement, Setting, AuditLog, SaleReturn, SaleReturnItem, PurchaseReturn,
    PurchaseReturnItem, SupplierPayment, CustomerPayment,
  ];
  let moved = 0;
  for (const M of scoped) {
    // Don't pull the super-admin into a tenant.
    const where = M === User ? { TenantId: null, role: { [Op.ne]: 'superadmin' } } : { TenantId: null };
    const [count] = await M.update({ TenantId: tenant.id }, { where });
    moved += count || 0;
  }
  logger.info(`Tenant migration complete. Default Shop id=${tenant.id}, rows moved=${moved}. Super-admin: ${SUPERADMIN.email} / ${SUPERADMIN.password}`);
};

export const runSeed = async () => {
  const existing = await User.count();
  if (existing > 0) {
    logger.info('Seed skipped (data already present)');
    return;
  }
  logger.info('Seeding initial data...');

  await ensureSuperadmin();
  const tenant = await Tenant.create({ name: 'Al-Madina Stationery & Books', slug: 'al-madina', plan: 'pro', status: 'active' });

  // Everything below is created inside the demo shop's tenant context so the
  // auto-stamp hook tags each row with TenantId.
  await runWithTenant({ tenantId: tenant.id, isSuperadmin: false }, async () => {
  // Users
  await User.bulkCreate(
    [
      { name: 'Store Admin', email: 'admin@pos.com', password: 'admin123', role: 'admin', phone: '03001234567', permissions: [] },
      { name: 'Ali Cashier', email: 'cashier@pos.com', password: 'cashier123', role: 'cashier', phone: '03007654321', permissions: ['pos', 'products', 'inventory', 'customers'] },
    ],
    { individualHooks: true }
  );

  // Settings
  await Setting.create({
    shopName: 'Al-Madina Stationery & Books',
    address: 'Shop 12, Urdu Bazaar, Lahore, Pakistan',
    phone: '042-37654321',
    taxPercentage: 0,
    currency: 'PKR',
    receiptFooter: 'Shukriya! Phir tashreef layen.',
    receiptTemplate: '80mm',
  });

  // Categories
  const categoryNames = ['Stationery', 'Books', 'Office Supplies', 'School Supplies', 'Printing Accessories'];
  const categories = await Category.bulkCreate(categoryNames.map((name) => ({ name })));
  const catId = (n) => categories.find((c) => c.name === n).id;

  // Suppliers
  const suppliers = await Supplier.bulkCreate([
    { name: 'Pak Stationery Wholesale', phone: '042-37001122', email: 'sales@pakstationery.pk', address: 'Hall Road, Lahore' },
    { name: 'National Book Depot', phone: '042-37553311', email: 'orders@nbd.pk', address: 'Urdu Bazaar, Lahore' },
    { name: 'Office Mart Distributors', phone: '042-35770099', email: 'info@officemart.pk', address: 'Gulberg, Lahore' },
  ]);

  // Customers
  await Customer.bulkCreate([
    { name: 'Walk-in Customer', phone: '', outstandingBalance: 0 },
    { name: 'Bilal Ahmed', phone: '03011112233', email: 'bilal@example.com', address: 'Model Town, Lahore', outstandingBalance: 0 },
    { name: 'Sana Traders (School)', phone: '03224445566', address: 'Johar Town, Lahore', outstandingBalance: 1500 },
  ]);

  // Products
  const products = [
    ['Dollar Pen Blue', 'Stationery', 'Dollar', 8, 15, 500, 50, 'pcs'],
    ['Piano Ball Pen Black', 'Stationery', 'Piano', 10, 20, 400, 50, 'pcs'],
    ['A4 Copy Paper Ream', 'Office Supplies', 'Sapphire', 750, 950, 120, 20, 'ream'],
    ['Register 100 Pages', 'School Supplies', 'Star', 60, 100, 200, 30, 'pcs'],
    ['Geometry Box', 'School Supplies', 'Oxford', 120, 200, 80, 15, 'pcs'],
    ['Stapler Medium', 'Office Supplies', 'Kangaro', 180, 300, 40, 10, 'pcs'],
    ['Glue Stick 15g', 'Stationery', 'UHU', 45, 80, 150, 25, 'pcs'],
    ['Marker Permanent Black', 'Stationery', 'Dollar', 25, 50, 300, 40, 'pcs'],
    ['English Grammar Book Gr.5', 'Books', 'Oxford', 250, 400, 60, 10, 'pcs'],
    ['Ink Cartridge Black 803', 'Printing Accessories', 'HP', 850, 1200, 25, 5, 'pcs'],
    ['Printer Paper Photo Glossy', 'Printing Accessories', 'Epson', 400, 600, 30, 8, 'pack'],
    ['Highlighter Set 5pc', 'Stationery', 'Faber-Castell', 200, 350, 90, 15, 'set'],
    ['File Folder Plastic', 'Office Supplies', 'Deli', 35, 70, 250, 30, 'pcs'],
    ['Scientific Calculator', 'School Supplies', 'Casio', 1100, 1600, 18, 5, 'pcs'],
    ['Drawing Sheet A3 (10)', 'School Supplies', 'Canson', 90, 150, 100, 20, 'pack'],
  ];

  let i = 1;
  for (const [name, cat, brand, pp, sp, qty, reorder, unit] of products) {
    await Product.create({
      name, brand,
      sku: `SKU-${String(i).padStart(4, '0')}`,
      barcode: `200000000${String(i).padStart(3, '0')}`,
      purchasePrice: pp, sellingPrice: sp, stockQuantity: qty,
      reorderLevel: reorder, unit, status: 'active', CategoryId: catId(cat),
    });
    i += 1;
  }
  }); // end runWithTenant

  logger.info('Seed complete. Super-admin: superadmin@pos.com / super123  |  Shop admin: admin@pos.com / admin123  |  Cashier: cashier@pos.com / cashier123');
};

// Allow running directly: `npm run seed`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await runSeed();
    process.exit(0);
  })();
}
