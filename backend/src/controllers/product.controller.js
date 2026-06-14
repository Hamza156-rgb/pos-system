import { Op, col, where as sqlWhere } from 'sequelize';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';
import { Product, Category } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/response.js';
import { logAudit } from '../middlewares/audit.js';

const genSku = () => 'SKU-' + Date.now().toString(36).toUpperCase();
const genBarcode = () => '20' + Math.floor(10000000000 + Math.random() * 89999999999);

export const list = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', categoryId, status, lowStock } = req.query;
  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } },
      { barcode: { [Op.like]: `%${search}%` } },
    ];
  }
  if (categoryId) where.CategoryId = categoryId;
  if (status) where.status = status;

  const andConds = [where];
  if (lowStock === 'true') {
    andConds.push(sqlWhere(col('stockQuantity'), Op.lte, col('reorderLevel')));
  }
  const options = {
    where: { [Op.and]: andConds },
    include: [{ model: Category, attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  };
  const { rows, count } = await Product.findAndCountAll(options);
  paginated(res, { rows, count, page, limit });
});

export const getOne = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, { include: [Category] });
  if (!product) throw ApiError.notFound('Product not found');
  ok(res, product);
});

export const getByBarcode = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ where: { barcode: req.params.barcode }, include: [Category] });
  if (!product) throw ApiError.notFound('Product not found');
  ok(res, product);
});

export const create = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.sku) data.sku = genSku();
  if (!data.barcode) data.barcode = genBarcode();
  const product = await Product.create(data);
  await logAudit({ userId: req.user.id, action: 'PRODUCT_CREATE', entity: 'Product', entityId: product.id, description: `Created ${product.name}`, ip: req.ip });
  created(res, product, 'Product created');
});

export const update = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  await product.update(req.body);
  await logAudit({ userId: req.user.id, action: 'PRODUCT_UPDATE', entity: 'Product', entityId: product.id, description: `Updated ${product.name}`, ip: req.ip });
  ok(res, product, 'Product updated');
});

export const remove = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  await product.destroy();
  await logAudit({ userId: req.user.id, action: 'PRODUCT_DELETE', entity: 'Product', entityId: req.params.id, ip: req.ip });
  ok(res, null, 'Product deleted');
});

export const exportCsv = asyncHandler(async (req, res) => {
  const products = await Product.findAll({ include: [Category] });
  const records = products.map((p) => ({
    name: p.name, sku: p.sku, barcode: p.barcode, brand: p.brand,
    category: p.Category?.name || '', purchasePrice: p.purchasePrice,
    sellingPrice: p.sellingPrice, stockQuantity: p.stockQuantity,
    reorderLevel: p.reorderLevel, unit: p.unit, status: p.status,
  }));
  const csv = stringify(records, { header: true });
  res.header('Content-Type', 'text/csv');
  res.attachment('products.csv');
  res.send(csv);
});

export const importCsv = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('CSV file required (field name: file)');
  const rows = parse(req.file.buffer.toString(), { columns: true, skip_empty_lines: true, trim: true });
  const cats = await Category.findAll();
  const catMap = Object.fromEntries(cats.map((c) => [c.name.toLowerCase(), c.id]));
  let createdCount = 0, updated = 0;
  for (const r of rows) {
    const payload = {
      name: r.name,
      sku: r.sku || genSku(),
      barcode: r.barcode || genBarcode(),
      brand: r.brand,
      purchasePrice: parseFloat(r.purchasePrice) || 0,
      sellingPrice: parseFloat(r.sellingPrice) || 0,
      stockQuantity: parseInt(r.stockQuantity) || 0,
      reorderLevel: parseInt(r.reorderLevel) || 5,
      unit: r.unit || 'pcs',
      status: r.status || 'active',
      CategoryId: catMap[(r.category || '').toLowerCase()] || null,
    };
    const existing = await Product.findOne({ where: { sku: payload.sku } });
    if (existing) { await existing.update(payload); updated++; }
    else { await Product.create(payload); createdCount++; }
  }
  ok(res, { created: createdCount, updated }, `Imported ${createdCount + updated} products`);
});
