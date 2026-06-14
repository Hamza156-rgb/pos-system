import { Router } from 'express';
import * as ctrl from '../controllers/supplier.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate, requirePermission('suppliers'));
r.get('/', ctrl.list);
r.get('/:id', ctrl.getOne);
r.post('/', ctrl.create);
r.put('/:id', ctrl.update);
r.post('/:id/pay', ctrl.pay);
r.delete('/:id', ctrl.remove);
export default r;
