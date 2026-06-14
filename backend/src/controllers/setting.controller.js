import { Setting } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';

export const get = asyncHandler(async (req, res) => {
  let setting = await Setting.findOne();
  if (!setting) setting = await Setting.create({});
  ok(res, setting);
});

export const update = asyncHandler(async (req, res) => {
  let setting = await Setting.findOne();
  if (!setting) setting = await Setting.create({});
  await setting.update(req.body);
  ok(res, setting, 'Settings updated');
});
