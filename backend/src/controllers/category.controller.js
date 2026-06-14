import { Category, Product } from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const cats = await Category.findAll({ order: [['name', 'ASC']] });
  ok(res, cats);
});
export const create = asyncHandler(async (req, res) => {
  const cat = await Category.create({ name: req.body.name, description: req.body.description });
  created(res, cat, 'Category created');
});
export const update = asyncHandler(async (req, res) => {
  const cat = await Category.findByPk(req.params.id);
  if (!cat) throw ApiError.notFound('Category not found');
  await cat.update({ name: req.body.name, description: req.body.description });
  ok(res, cat, 'Category updated');
});
export const remove = asyncHandler(async (req, res) => {
  const cat = await Category.findByPk(req.params.id);
  if (!cat) throw ApiError.notFound('Category not found');
  const count = await Product.count({ where: { CategoryId: cat.id } });
  if (count) throw ApiError.conflict('Cannot delete category with products');
  await cat.destroy();
  ok(res, null, 'Category deleted');
});
