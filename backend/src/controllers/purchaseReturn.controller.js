import {
  sequelize, Purchase, PurchaseItem, PurchaseReturn, PurchaseReturnItem, Supplier, Product, User,
} from '../models/index.js';
import { adjustStock } from '../services/inventory.service.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import { logAudit } from '../middlewares/audit.js';

const genReturnNumber = () => 'PR-' + Date.now().toString(36).toUpperCase();

export const list = asyncHandler(async (req, res) => {
  const returns = await PurchaseReturn.findAll({
    include: [{ model: Purchase, attributes: ['id', 'orderNumber'] }, { model: Supplier, attributes: ['id', 'name'] }, { model: User, attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit: 200,
  });
  ok(res, returns);
});

export const getOne = asyncHandler(async (req, res) => {
  const ret = await PurchaseReturn.findByPk(req.params.id, {
    include: [{ model: PurchaseReturnItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'sku'] }] }, Purchase, Supplier],
  });
  if (!ret) throw ApiError.notFound('Return not found');
  ok(res, ret);
});

// Returnable quantities for a received purchase order.
export const returnable = asyncHandler(async (req, res) => {
  const po = await Purchase.findByPk(req.params.purchaseId, {
    include: [{ model: PurchaseItem, as: 'items', include: [{ model: Product, attributes: ['id', 'name', 'sku'] }] }],
  });
  if (!po) throw ApiError.notFound('Purchase not found');
  const prior = await PurchaseReturn.findAll({ where: { PurchaseId: po.id }, include: [{ model: PurchaseReturnItem, as: 'items' }] });
  const returned = {};
  for (const r of prior) for (const it of r.items) returned[it.ProductId] = (returned[it.ProductId] || 0) + it.quantity;

  const lines = po.items.map((it) => ({
    productId: it.ProductId,
    productName: it.Product?.name || `#${it.ProductId}`,
    purchasePrice: Number(it.purchasePrice),
    received: it.quantity,
    alreadyReturned: returned[it.ProductId] || 0,
    returnable: it.quantity - (returned[it.ProductId] || 0),
  }));
  ok(res, { purchase: { id: po.id, orderNumber: po.orderNumber, status: po.status, SupplierId: po.SupplierId }, lines });
});

export const create = asyncHandler(async (req, res) => {
  const { purchaseId, items = [], reason } = req.body;
  if (!purchaseId) throw ApiError.badRequest('purchaseId is required');
  const requested = items.filter((i) => Number(i.quantity) > 0);
  if (!requested.length) throw ApiError.badRequest('Select at least one item to return');

  const result = await sequelize.transaction(async (t) => {
    const po = await Purchase.findByPk(purchaseId, { include: [{ model: PurchaseItem, as: 'items' }], transaction: t });
    if (!po) throw ApiError.notFound('Purchase not found');
    if (po.status !== 'received') throw ApiError.badRequest('Only received purchase orders can be returned');

    const prior = await PurchaseReturn.findAll({ where: { PurchaseId: po.id }, include: [{ model: PurchaseReturnItem, as: 'items' }], transaction: t });
    const returned = {};
    for (const r of prior) for (const it of r.items) returned[it.ProductId] = (returned[it.ProductId] || 0) + it.quantity;

    const byProduct = {};
    for (const it of po.items) byProduct[it.ProductId] = it;

    let total = 0;
    const toCreate = [];
    for (const reqItem of requested) {
      const pid = Number(reqItem.productId);
      const line = byProduct[pid];
      if (!line) throw ApiError.badRequest('Item was not part of this purchase');
      const qty = Number(reqItem.quantity);
      const remaining = line.quantity - (returned[pid] || 0);
      if (qty > remaining) throw ApiError.badRequest(`Cannot return ${qty} (only ${remaining} returnable)`);
      const purchasePrice = Number(line.purchasePrice);
      const lineTotal = +(purchasePrice * qty).toFixed(2);
      total += lineTotal;
      toCreate.push({ productId: pid, quantity: qty, purchasePrice, lineTotal });
    }
    total = +total.toFixed(2);

    const pr = await PurchaseReturn.create(
      { returnNumber: genReturnNumber(), totalAmount: total, PurchaseId: po.id, SupplierId: po.SupplierId, UserId: req.user.id, reason },
      { transaction: t }
    );

    for (const it of toCreate) {
      await PurchaseReturnItem.create(
        { PurchaseReturnId: pr.id, ProductId: it.productId, quantity: it.quantity, purchasePrice: it.purchasePrice, lineTotal: it.lineTotal },
        { transaction: t }
      );
      // Goods leave our stock back to the supplier.
      await adjustStock(
        { productId: it.productId, type: 'out', quantity: it.quantity, reason: 'Purchase return', reference: pr.returnNumber, userId: req.user.id },
        t
      );
    }

    // We owe the supplier less now.
    if (po.SupplierId) {
      const supplier = await Supplier.findByPk(po.SupplierId, { transaction: t });
      if (supplier) {
        supplier.outstandingBalance = +(Number(supplier.outstandingBalance) - total).toFixed(2);
        await supplier.save({ transaction: t });
      }
    }

    return pr;
  });

  await logAudit({ userId: req.user.id, action: 'PURCHASE_RETURN', entity: 'PurchaseReturn', entityId: result.id, description: result.returnNumber, ip: req.ip });
  const full = await PurchaseReturn.findByPk(result.id, { include: [{ model: PurchaseReturnItem, as: 'items' }, Purchase, Supplier] });
  created(res, full, 'Purchase return processed');
});
