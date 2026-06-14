import { sequelize, Purchase, PurchaseItem, Product, Supplier } from '../models/index.js';
import { adjustStock } from '../services/inventory.service.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import { logAudit } from '../middlewares/audit.js';

const genOrderNumber = () => 'PO-' + Date.now().toString(36).toUpperCase();

export const list = asyncHandler(async (req, res) => {
  const purchases = await Purchase.findAll({
    include: [{ model: Supplier, attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  ok(res, purchases);
});

export const getOne = asyncHandler(async (req, res) => {
  const purchase = await Purchase.findByPk(req.params.id, {
    include: [Supplier, { model: PurchaseItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'sku'] }] }],
  });
  if (!purchase) throw ApiError.notFound('Purchase not found');
  ok(res, purchase);
});

export const create = asyncHandler(async (req, res) => {
  const { supplierId, items = [], taxPercentage = 0, notes, status = 'pending' } = req.body;
  if (!items.length) throw ApiError.badRequest('Purchase needs at least one item');

  const purchase = await sequelize.transaction(async (t) => {
    let subtotal = 0;
    for (const it of items) subtotal += Number(it.purchasePrice) * Number(it.quantity);
    const tax = +(subtotal * (Number(taxPercentage) / 100)).toFixed(2);
    const totalAmount = +(subtotal + tax).toFixed(2);

    const po = await Purchase.create(
      { orderNumber: genOrderNumber(), subtotal, tax, totalAmount, status, notes, SupplierId: supplierId, UserId: req.user.id },
      { transaction: t }
    );
    for (const it of items) {
      await PurchaseItem.create(
        { PurchaseId: po.id, ProductId: it.productId, quantity: it.quantity, purchasePrice: it.purchasePrice, lineTotal: Number(it.purchasePrice) * Number(it.quantity) },
        { transaction: t }
      );
    }
    // If created directly as received, push stock in
    if (status === 'received') {
      for (const it of items) {
        await adjustStock({ productId: it.productId, type: 'in', quantity: Number(it.quantity), reason: 'Purchase received', reference: po.orderNumber, userId: req.user.id }, t);
      }
    }
    return po;
  });
  await logAudit({ userId: req.user.id, action: 'PURCHASE_CREATE', entity: 'Purchase', entityId: purchase.id, ip: req.ip });
  created(res, purchase, 'Purchase order created');
});

// Mark a pending PO as received -> stock in
export const receive = asyncHandler(async (req, res) => {
  const result = await sequelize.transaction(async (t) => {
    const po = await Purchase.findByPk(req.params.id, { include: [{ model: PurchaseItem, as: 'items' }], transaction: t });
    if (!po) throw ApiError.notFound('Purchase not found');
    if (po.status === 'received') throw ApiError.badRequest('Already received');
    if (po.status === 'cancelled') throw ApiError.badRequest('Cancelled order cannot be received');
    for (const item of po.items) {
      await adjustStock({ productId: item.ProductId, type: 'in', quantity: item.quantity, reason: 'Purchase received', reference: po.orderNumber, userId: req.user.id }, t);
    }
    po.status = 'received';
    await po.save({ transaction: t });
    return po;
  });
  await logAudit({ userId: req.user.id, action: 'PURCHASE_RECEIVE', entity: 'Purchase', entityId: result.id, ip: req.ip });
  ok(res, result, 'Purchase received and stock updated');
});

export const cancel = asyncHandler(async (req, res) => {
  const po = await Purchase.findByPk(req.params.id);
  if (!po) throw ApiError.notFound('Purchase not found');
  if (po.status === 'received') throw ApiError.badRequest('Cannot cancel a received order');
  po.status = 'cancelled';
  await po.save();
  ok(res, po, 'Purchase cancelled');
});
