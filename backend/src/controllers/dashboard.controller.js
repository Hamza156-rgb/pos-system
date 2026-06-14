import { Op, fn, col, literal } from 'sequelize';
import { Sale, SaleItem, Product, Customer } from '../models/index.js';
import { col as colRef, where as sqlWhere } from 'sequelize';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

const sumBetween = async (start, end) => {
  const r = await Sale.findOne({
    attributes: [[fn('COALESCE', fn('SUM', col('grandTotal')), 0), 'total'], [fn('COUNT', col('id')), 'count']],
    where: { createdAt: { [Op.between]: [start, end] } },
    raw: true,
  });
  return { total: Number(r.total), count: Number(r.count) };
};

export const stats = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
  const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30);

  const [today, week, month] = await Promise.all([
    sumBetween(todayStart, now), sumBetween(weekStart, now), sumBetween(monthStart, now),
  ]);

  const totalProducts = await Product.count();
  const totalCustomers = await Customer.count();
  const lowStockCount = await Product.count({ where: sqlWhere(colRef('stockQuantity'), Op.lte, colRef('reorderLevel')) });

  // Top selling products (by qty, last 30 days)
  const topSelling = await SaleItem.findAll({
    attributes: ['productName', [fn('SUM', col('quantity')), 'qtySold'], [fn('SUM', col('lineTotal')), 'revenue']],
    include: [{ model: Sale, attributes: [], where: { createdAt: { [Op.gte]: monthStart } } }],
    group: ['productName'],
    order: [[literal('qtySold'), 'DESC']],
    limit: 5,
    raw: true,
  });

  // Sales by day, last 7 days
  const dailySeries = await Sale.findAll({
    attributes: [[fn('DATE', col('createdAt')), 'date'], [fn('SUM', col('grandTotal')), 'total']],
    where: { createdAt: { [Op.gte]: weekStart } },
    group: [fn('DATE', col('createdAt'))],
    order: [[fn('DATE', col('createdAt')), 'ASC']],
    raw: true,
  });

  const recent = await Sale.findAll({ order: [['createdAt', 'DESC']], limit: 8, attributes: ['id', 'invoiceNumber', 'grandTotal', 'paymentMethod', 'createdAt'] });

  ok(res, {
    todaySales: today.total, todayCount: today.count,
    weeklySales: week.total, monthlySales: month.total,
    totalProducts, totalCustomers, lowStockCount,
    topSelling, dailySeries, recent,
  });
});
