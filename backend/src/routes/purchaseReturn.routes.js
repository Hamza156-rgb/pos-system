import { Router } from 'express';
import * as ctrl from '../controllers/purchaseReturn.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate, requirePermission('purchase-returns'));
r.get('/', ctrl.list);
r.get('/returnable/:purchaseId', ctrl.returnable);
r.get('/:id', ctrl.getOne);
r.post('/', ctrl.create);
export default r;
