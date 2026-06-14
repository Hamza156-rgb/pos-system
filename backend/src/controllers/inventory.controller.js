import { sequelize, InventoryMovement, Product, Category } from '../models/index.js';
import { col, where as sqlWhere, Op } from 'sequelize';
import { adjustStock } from '../services/inventory.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, paginated } from '../utils/response.js';
import { logAudit } from '../middlewares/audit.js';

export const movements = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, productId } = req.query;
  const where = productId ? { ProductId: productId } : {};
  const { rows, count } = await InventoryMovement.findAndCountAll({
    where,
    include: [{ model: Product, attributes: ['id', 'name', 'sku'] }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });
  paginated(res, { rows, count, page, limit });
});

export const adjust = asyncHandler(async (req, res) => {
  const { productId, type, quantity, reason } = req.body;
  const product = await sequelize.transaction((t) =>
    adjustStock({ productId, type, quantity: Number(quantity), reason: reason || 'Manual adjustment', reference: 'MANUAL', userId: req.user.id }, t)
  );
  await logAudit({ userId: req.user.id, action: 'STOCK_ADJUST', entity: 'Product', entityId: productId, description: `${type} ${quantity}`, ip: req.ip });
  ok(res, product, 'Stock adjusted');
});

export const lowStock = asyncHandler(async (req, res) => {
  const products = await Product.findAll({
    where: sqlWhere(col('stockQuantity'), Op.lte, col('reorderLevel')),
    include: [{ model: Category, attributes: ['name'] }],
    order: [['stockQuantity', 'ASC']],
  });
  ok(res, products);
});
