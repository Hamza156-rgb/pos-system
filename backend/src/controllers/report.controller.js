import { Op } from 'sequelize';
import {
  Sale, SaleItem, Product, Category, Customer, Supplier,
  SaleReturn, SaleReturnItem, PurchaseReturn,
} from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

const rangeFromQuery = (q) => {
  const { period = 'daily', from, to } = q;
  const now = new Date();
  let start = new Date(); start.setHours(0, 0, 0, 0);
  let end = new Date(); end.setHours(23, 59, 59, 999);
  if (from && to) { start = new Date(from); end = new Date(to); end.setHours(23, 59, 59, 999); }
  else if (period === 'weekly') start.setDate(now.getDate() - 7);
  else if (period === 'monthly') start.setDate(now.getDate() - 30);
  else if (period === 'yearly') start.setFullYear(now.getFullYear() - 1);
  return { start, end };
};

export const salesReport = asyncHandler(async (req, res) => {
  const { start, end } = rangeFromQuery(req.query);
  const sales = await Sale.findAll({ where: { createdAt: { [Op.between]: [start, end] } }, order: [['createdAt', 'ASC']] });
  const totals = sales.reduce((a, s) => {
    a.revenue += Number(s.grandTotal); a.discount += Number(s.discount);
    a.tax += Number(s.tax); a.count += 1; return a;
  }, { revenue: 0, discount: 0, tax: 0, count: 0 });
  ok(res, { range: { from: start, to: end }, totals, sales });
});

export const inventoryReport = asyncHandler(async (req, res) => {
  const products = await Product.findAll({ include: [{ model: Category, attributes: ['name'] }], order: [['name', 'ASC']] });
  const valuation = products.reduce((a, p) => {
    a.costValue += Number(p.purchasePrice) * p.stockQuantity;
    a.retailValue += Number(p.sellingPrice) * p.stockQuantity;
    a.units += p.stockQuantity;
    return a;
  }, { costValue: 0, retailValue: 0, units: 0 });
  const lowStock = products.filter((p) => p.stockQuantity <= p.reorderLevel);
  ok(res, { valuation, lowStockCount: lowStock.length, products });
});

export const financialReport = asyncHandler(async (req, res) => {
  const { start, end } = rangeFromQuery(req.query);
  // Revenue & COGS via sale items joined to product purchase price
  const items = await SaleItem.findAll({
    include: [
      { model: Sale, attributes: [], where: { createdAt: { [Op.between]: [start, end] } } },
      { model: Product, attributes: ['purchasePrice'] },
    ],
  });
  let revenue = 0, cogs = 0;
  for (const it of items) {
    revenue += Number(it.lineTotal);
    cogs += Number(it.Product?.purchasePrice || 0) * it.quantity;
  }
  const grossProfit = +(revenue - cogs).toFixed(2);
  ok(res, { range: { from: start, to: end }, revenue: +revenue.toFixed(2), cogs: +cogs.toFixed(2), grossProfit, margin: revenue ? +((grossProfit / revenue) * 100).toFixed(2) : 0 });
});

// Sales-based Profit & Loss, net of sale returns.
export const profitLoss = asyncHandler(async (req, res) => {
  const { start, end } = rangeFromQuery(req.query);

  const items = await SaleItem.findAll({
    include: [
      { model: Sale, attributes: [], where: { createdAt: { [Op.between]: [start, end] } } },
      { model: Product, attributes: ['purchasePrice'] },
    ],
  });
  let grossRevenue = 0, grossCogs = 0;
  for (const it of items) {
    grossRevenue += Number(it.lineTotal);
    grossCogs += Number(it.Product?.purchasePrice || 0) * it.quantity;
  }

  const returnItems = await SaleReturnItem.findAll({
    include: [
      { model: SaleReturn, attributes: [], where: { createdAt: { [Op.between]: [start, end] } } },
      { model: Product, attributes: ['purchasePrice'] },
    ],
  });
  let returnsRevenue = 0, returnsCogs = 0;
  for (const it of returnItems) {
    returnsRevenue += Number(it.lineTotal);
    returnsCogs += Number(it.Product?.purchasePrice || 0) * it.quantity;
  }

  const netRevenue = +(grossRevenue - returnsRevenue).toFixed(2);
  const netCogs = +(grossCogs - returnsCogs).toFixed(2);
  const grossProfit = +(netRevenue - netCogs).toFixed(2);
  ok(res, {
    range: { from: start, to: end },
    grossRevenue: +grossRevenue.toFixed(2),
    salesReturns: +returnsRevenue.toFixed(2),
    netRevenue,
    cogs: netCogs,
    grossProfit,
    margin: netRevenue ? +((grossProfit / netRevenue) * 100).toFixed(2) : 0,
  });
});

// Top selling products by quantity over the range.
export const topProducts = asyncHandler(async (req, res) => {
  const { start, end } = rangeFromQuery(req.query);
  const items = await SaleItem.findAll({ include: [{ model: Sale, attributes: [], where: { createdAt: { [Op.between]: [start, end] } } }] });
  const byProduct = {};
  for (const it of items) {
    const k = it.ProductId;
    byProduct[k] = byProduct[k] || { productName: it.productName, qty: 0, revenue: 0 };
    byProduct[k].qty += it.quantity;
    byProduct[k].revenue += Number(it.lineTotal);
  }
  const rows = Object.values(byProduct).sort((a, b) => b.qty - a.qty).slice(0, 20)
    .map((r) => ({ ...r, revenue: +r.revenue.toFixed(2) }));
  ok(res, { range: { from: start, to: end }, rows });
});

// Sales grouped by payment method.
export const paymentMethods = asyncHandler(async (req, res) => {
  const { start, end } = rangeFromQuery(req.query);
  const sales = await Sale.findAll({ where: { createdAt: { [Op.between]: [start, end] } } });
  const byMethod = {};
  for (const s of sales) {
    const k = s.paymentMethod;
    byMethod[k] = byMethod[k] || { method: k, count: 0, total: 0 };
    byMethod[k].count += 1;
    byMethod[k].total += Number(s.grandTotal);
  }
  ok(res, { range: { from: start, to: end }, rows: Object.values(byMethod).map((r) => ({ ...r, total: +r.total.toFixed(2) })) });
});

// Sales grouped by product category.
export const salesByCategory = asyncHandler(async (req, res) => {
  const { start, end } = rangeFromQuery(req.query);
  const items = await SaleItem.findAll({
    include: [
      { model: Sale, attributes: [], where: { createdAt: { [Op.between]: [start, end] } } },
      { model: Product, attributes: ['CategoryId'], include: [{ model: Category, attributes: ['name'] }] },
    ],
  });
  const byCat = {};
  for (const it of items) {
    const name = it.Product?.Category?.name || 'Uncategorized';
    byCat[name] = byCat[name] || { category: name, qty: 0, revenue: 0 };
    byCat[name].qty += it.quantity;
    byCat[name].revenue += Number(it.lineTotal);
  }
  const rows = Object.values(byCat).sort((a, b) => b.revenue - a.revenue).map((r) => ({ ...r, revenue: +r.revenue.toFixed(2) }));
  ok(res, { range: { from: start, to: end }, rows });
});

// Sale & purchase returns summary over the range.
export const returnsReport = asyncHandler(async (req, res) => {
  const { start, end } = rangeFromQuery(req.query);
  const [saleReturns, purchaseReturns] = await Promise.all([
    SaleReturn.findAll({ where: { createdAt: { [Op.between]: [start, end] } }, include: [{ model: Sale, attributes: ['invoiceNumber'] }], order: [['createdAt', 'DESC']] }),
    PurchaseReturn.findAll({ where: { createdAt: { [Op.between]: [start, end] } }, include: [{ model: Supplier, attributes: ['name'] }], order: [['createdAt', 'DESC']] }),
  ]);
  ok(res, {
    range: { from: start, to: end },
    saleReturns,
    purchaseReturns,
    totals: {
      saleReturns: +saleReturns.reduce((s, r) => s + Number(r.totalAmount), 0).toFixed(2),
      purchaseReturns: +purchaseReturns.reduce((s, r) => s + Number(r.totalAmount), 0).toFixed(2),
    },
  });
});

// Outstanding customer receivables (Udhaar).
export const receivables = asyncHandler(async (req, res) => {
  const customers = await Customer.findAll({ where: { outstandingBalance: { [Op.gt]: 0 } }, order: [['outstandingBalance', 'DESC']] });
  const total = customers.reduce((s, c) => s + Number(c.outstandingBalance), 0);
  ok(res, { total: +total.toFixed(2), customers });
});

// Outstanding supplier payables.
export const payables = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.findAll({ where: { outstandingBalance: { [Op.gt]: 0 } }, order: [['outstandingBalance', 'DESC']] });
  const total = suppliers.reduce((s, x) => s + Number(x.outstandingBalance), 0);
  ok(res, { total: +total.toFixed(2), suppliers });
});
