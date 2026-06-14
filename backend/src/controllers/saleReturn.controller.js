import {
  sequelize, Sale, SaleItem, SaleReturn, SaleReturnItem, Customer, User,
} from '../models/index.js';
import { adjustStock } from '../services/inventory.service.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import { logAudit } from '../middlewares/audit.js';

const genReturnNumber = () => 'SR-' + Date.now().toString(36).toUpperCase();

export const list = asyncHandler(async (req, res) => {
  const returns = await SaleReturn.findAll({
    include: [{ model: Sale, attributes: ['id', 'invoiceNumber'] }, { model: Customer, attributes: ['id', 'name'] }, { model: User, attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit: 200,
  });
  ok(res, returns);
});

export const getOne = asyncHandler(async (req, res) => {
  const ret = await SaleReturn.findByPk(req.params.id, {
    include: [{ model: SaleReturnItem, as: 'items' }, Sale, Customer, { model: User, attributes: ['id', 'name'] }],
  });
  if (!ret) throw ApiError.notFound('Return not found');
  ok(res, ret);
});

// How much of each line on a sale can still be returned.
export const returnable = asyncHandler(async (req, res) => {
  const sale = await Sale.findByPk(req.params.saleId, { include: [{ model: SaleItem, as: 'items' }] });
  if (!sale) throw ApiError.notFound('Sale not found');
  const prior = await SaleReturn.findAll({ where: { SaleId: sale.id }, include: [{ model: SaleReturnItem, as: 'items' }] });
  const returned = {};
  for (const r of prior) for (const it of r.items) returned[it.ProductId] = (returned[it.ProductId] || 0) + it.quantity;

  const lines = sale.items.map((it) => ({
    productId: it.ProductId,
    productName: it.productName,
    unitPrice: Number(it.unitPrice),
    sold: it.quantity,
    alreadyReturned: returned[it.ProductId] || 0,
    returnable: it.quantity - (returned[it.ProductId] || 0),
  }));
  ok(res, { sale: { id: sale.id, invoiceNumber: sale.invoiceNumber, isCredit: sale.isCredit, CustomerId: sale.CustomerId }, lines });
});

export const create = asyncHandler(async (req, res) => {
  const { saleId, items = [], reason } = req.body;
  if (!saleId) throw ApiError.badRequest('saleId is required');
  const requested = items.filter((i) => Number(i.quantity) > 0);
  if (!requested.length) throw ApiError.badRequest('Select at least one item to return');

  const result = await sequelize.transaction(async (t) => {
    const sale = await Sale.findByPk(saleId, { include: [{ model: SaleItem, as: 'items' }], transaction: t });
    if (!sale) throw ApiError.notFound('Sale not found');

    // Already-returned quantities for this sale
    const prior = await SaleReturn.findAll({ where: { SaleId: sale.id }, include: [{ model: SaleReturnItem, as: 'items' }], transaction: t });
    const returned = {};
    for (const r of prior) for (const it of r.items) returned[it.ProductId] = (returned[it.ProductId] || 0) + it.quantity;

    const soldByProduct = {};
    for (const it of sale.items) soldByProduct[it.ProductId] = it;

    let total = 0;
    const toCreate = [];
    for (const reqItem of requested) {
      const pid = Number(reqItem.productId);
      const line = soldByProduct[pid];
      if (!line) throw ApiError.badRequest('Item was not part of this sale');
      const qty = Number(reqItem.quantity);
      const remaining = line.quantity - (returned[pid] || 0);
      if (qty > remaining) throw ApiError.badRequest(`Cannot return ${qty} of "${line.productName}" (only ${remaining} returnable)`);
      const unitPrice = Number(line.unitPrice);
      const lineTotal = +(unitPrice * qty).toFixed(2);
      total += lineTotal;
      toCreate.push({ productId: pid, productName: line.productName, quantity: qty, unitPrice, lineTotal });
    }
    total = +total.toFixed(2);

    const saleReturn = await SaleReturn.create(
      { returnNumber: genReturnNumber(), totalAmount: total, SaleId: sale.id, CustomerId: sale.CustomerId, UserId: req.user?.id || sale.UserId, reason },
      { transaction: t }
    );

    for (const it of toCreate) {
      await SaleReturnItem.create(
        { SaleReturnId: saleReturn.id, ProductId: it.productId, productName: it.productName, quantity: it.quantity, unitPrice: it.unitPrice, lineTotal: it.lineTotal },
        { transaction: t }
      );
      await adjustStock(
        { productId: it.productId, type: 'in', quantity: it.quantity, reason: 'Sale return', reference: saleReturn.returnNumber, userId: req.user.id },
        t
      );
    }

    // Smart refund: reduce Udhaar first for credit sales, remainder is cash.
    let creditAdjusted = 0;
    let cashRefunded = total;
    if (sale.isCredit && sale.CustomerId) {
      const customer = await Customer.findByPk(sale.CustomerId, { transaction: t });
      if (customer) {
        const outstanding = Number(customer.outstandingBalance);
        creditAdjusted = Math.min(total, outstanding);
        if (creditAdjusted > 0) {
          customer.outstandingBalance = +(outstanding - creditAdjusted).toFixed(2);
          await customer.save({ transaction: t });
        }
        cashRefunded = +(total - creditAdjusted).toFixed(2);
      }
    }
    saleReturn.creditAdjusted = creditAdjusted;
    saleReturn.cashRefunded = cashRefunded;
    saleReturn.refundMethod = creditAdjusted > 0 ? (cashRefunded > 0 ? 'mixed' : 'credit') : 'cash';
    await saleReturn.save({ transaction: t });

    // Mark sale fully refunded if every line has been returned.
    const fully = sale.items.every((it) => (returned[it.ProductId] || 0) + (toCreate.find((c) => c.productId === it.ProductId)?.quantity || 0) >= it.quantity);
    if (fully) { sale.status = 'refunded'; await sale.save({ transaction: t }); }

    return saleReturn;
  });

  await logAudit({ userId: req.user.id, action: 'SALE_RETURN', entity: 'SaleReturn', entityId: result.id, description: result.returnNumber, ip: req.ip });
  const full = await SaleReturn.findByPk(result.id, { include: [{ model: SaleReturnItem, as: 'items' }, Sale, Customer] });
  created(res, full, 'Sale return processed');
});
