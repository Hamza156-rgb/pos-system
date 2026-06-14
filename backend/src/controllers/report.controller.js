import { Op, fn, col, literal } from 'sequelize';
import { col as colRef, where as sqlWhere } from 'sequelize';
import { Sale, SaleItem, Product, Category } from '../models/index.js';
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
