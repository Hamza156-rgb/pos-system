import { Supplier, Purchase, SupplierPayment } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  ok(res, await Supplier.findAll({ order: [['name', 'ASC']] }));
});
export const getOne = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findByPk(req.params.id, {
    include: [{ model: Purchase, order: [['createdAt', 'DESC']] }],
  });
  if (!supplier) throw ApiError.notFound('Supplier not found');
  ok(res, supplier);
});
export const create = asyncHandler(async (req, res) => {
  created(res, await Supplier.create(req.body), 'Supplier created');
});
export const update = asyncHandler(async (req, res) => {
  const s = await Supplier.findByPk(req.params.id);
  if (!s) throw ApiError.notFound('Supplier not found');
  await s.update(req.body);
  ok(res, s, 'Supplier updated');
});
export const remove = asyncHandler(async (req, res) => {
  const s = await Supplier.findByPk(req.params.id);
  if (!s) throw ApiError.notFound('Supplier not found');
  await s.destroy();
  ok(res, null, 'Supplier deleted');
});

// Pay down what we owe a supplier.
export const pay = asyncHandler(async (req, res) => {
  const s = await Supplier.findByPk(req.params.id);
  if (!s) throw ApiError.notFound('Supplier not found');
  const amount = Number(req.body.amount || 0);
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive');
  s.outstandingBalance = +(Number(s.outstandingBalance) - amount).toFixed(2);
  await s.save();
  await SupplierPayment.create({
    SupplierId: s.id, amount, method: req.body.method || 'cash', note: req.body.note || 'Payment to supplier', UserId: req.user?.id,
  });
  ok(res, s, 'Payment recorded');
});
