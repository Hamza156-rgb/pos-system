import { Op } from 'sequelize';
import { Customer, Sale, SaleItem, CustomerPayment } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const { search = '' } = req.query;
  const where = search
    ? { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { phone: { [Op.like]: `%${search}%` } }] }
    : {};
  ok(res, await Customer.findAll({ where, order: [['name', 'ASC']] }));
});

export const getOne = asyncHandler(async (req, res) => {
  const customer = await Customer.findByPk(req.params.id, {
    include: [{ model: Sale, include: [{ model: SaleItem, as: 'items' }], order: [['createdAt', 'DESC']] }],
  });
  if (!customer) throw ApiError.notFound('Customer not found');
  const totalPurchases = (customer.Sales || []).reduce((s, x) => s + Number(x.grandTotal), 0);
  ok(res, { ...customer.toJSON(), totalPurchases });
});

export const create = asyncHandler(async (req, res) => {
  created(res, await Customer.create(req.body), 'Customer created');
});
export const update = asyncHandler(async (req, res) => {
  const c = await Customer.findByPk(req.params.id);
  if (!c) throw ApiError.notFound('Customer not found');
  await c.update(req.body);
  ok(res, c, 'Customer updated');
});
export const remove = asyncHandler(async (req, res) => {
  const c = await Customer.findByPk(req.params.id);
  if (!c) throw ApiError.notFound('Customer not found');
  await c.destroy();
  ok(res, null, 'Customer deleted');
});

// Record a credit (Udhaar) repayment
export const settleCredit = asyncHandler(async (req, res) => {
  const c = await Customer.findByPk(req.params.id);
  if (!c) throw ApiError.notFound('Customer not found');
  const amount = Number(req.body.amount || 0);
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive');
  c.outstandingBalance = Math.max(0, +(Number(c.outstandingBalance) - amount).toFixed(2));
  await c.save();
  await CustomerPayment.create({
    CustomerId: c.id, amount, method: req.body.method || 'cash', note: req.body.note || 'Udhaar repayment', UserId: req.user?.id,
  });
  ok(res, c, 'Payment recorded');
});
