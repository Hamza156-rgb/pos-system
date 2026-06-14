import dotenv from 'dotenv';
import {
  sequelize, User, Category, Product, Supplier, Customer, Setting,
} from './models/index.js';
import logger from './utils/logger.js';

dotenv.config();

export const runSeed = async () => {
  const existing = await User.count();
  if (existing > 0) {
    logger.info('Seed skipped (data already present)');
    return;
  }
  logger.info('Seeding initial data...');

  // Users
  await User.bulkCreate(
    [
      { name: 'Store Admin', email: 'admin@pos.com', password: 'admin123', role: 'admin', phone: '03001234567' },
      { name: 'Ali Cashier', email: 'cashier@pos.com', password: 'cashier123', role: 'cashier', phone: '03007654321' },
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

  logger.info('Seed complete. Login: admin@pos.com / admin123  |  cashier@pos.com / cashier123');
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
