import { Supplier, Purchase } from '../models/index.js';
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
