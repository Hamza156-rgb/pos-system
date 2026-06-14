import { Op } from 'sequelize';
import { Sale, SaleItem, Customer, User, Product } from '../models/index.js';
import { createSale } from '../services/sale.service.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import { logAudit } from '../middlewares/audit.js';

export const create = asyncHandler(async (req, res) => {
  const sale = await createSale(req.body, req.user);
  await logAudit({ userId: req.user.id, action: 'SALE_CREATE', entity: 'Sale', entityId: sale.id, description: sale.invoiceNumber, ip: req.ip });
  const full = await Sale.findByPk(sale.id, { include: [{ model: SaleItem, as: 'items' }, Customer, { model: User, attributes: ['id', 'name'] }] });
  created(res, full, 'Sale completed');
});

// Bulk sync endpoint for offline sales queue
export const sync = asyncHandler(async (req, res) => {
  const { sales = [] } = req.body;
  const results = [];
  for (const s of sales) {
    try {
      const existing = s.offlineId ? await Sale.findOne({ where: { offlineId: s.offlineId } }) : null;
      if (existing) { results.push({ offlineId: s.offlineId, status: 'duplicate', invoiceNumber: existing.invoiceNumber }); continue; }
      const sale = await createSale(s, req.user);
      results.push({ offlineId: s.offlineId, status: 'synced', invoiceNumber: sale.invoiceNumber, id: sale.id });
    } catch (e) {
      results.push({ offlineId: s.offlineId, status: 'failed', error: e.message });
    }
  }
  ok(res, results, 'Sync processed');
});

export const list = asyncHandler(async (req, res) => {
  const { from, to, today } = req.query;
  const where = {};
  if (today === 'true') {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    where.createdAt = { [Op.gte]: start };
  } else if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(from);
    if (to) { const end = new Date(to); end.setHours(23, 59, 59, 999); where.createdAt[Op.lte] = end; }
  }
  const sales = await Sale.findAll({
    where,
    include: [Customer, { model: User, attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
    limit: 200,
  });
  ok(res, sales);
});

export const getOne = asyncHandler(async (req, res) => {
  const sale = await Sale.findByPk(req.params.id, {
    include: [{ model: SaleItem, as: 'items' }, Customer, { model: User, attributes: ['id', 'name'] }],
  });
  if (!sale) throw ApiError.notFound('Sale not found');
  ok(res, sale);
});

// Daily cash closing report
export const cashClosing = asyncHandler(async (req, res) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  const sales = await Sale.findAll({ where: { createdAt: { [Op.between]: [start, end] } } });
  const summary = sales.reduce((acc, s) => {
    acc.totalSales += Number(s.grandTotal);
    acc.count += 1;
    if (s.paymentMethod === 'cash') acc.cash += Number(s.amountPaid);
    else if (s.paymentMethod === 'card') acc.card += Number(s.grandTotal);
    else if (s.paymentMethod === 'mixed') { acc.cash += Number(s.cashAmount); acc.card += Number(s.cardAmount); }
    else if (s.paymentMethod === 'credit') acc.credit += Number(s.creditDue);
    return acc;
  }, { totalSales: 0, count: 0, cash: 0, card: 0, credit: 0 });
  ok(res, { date: start.toISOString().slice(0, 10), ...summary });
});
