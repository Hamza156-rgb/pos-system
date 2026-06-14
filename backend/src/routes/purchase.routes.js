import { Router } from 'express';
import * as ctrl from '../controllers/purchase.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate, authorize('admin'));
r.get('/', ctrl.list);
r.get('/:id', ctrl.getOne);
r.post('/', ctrl.create);
r.post('/:id/receive', ctrl.receive);
r.post('/:id/cancel', ctrl.cancel);
export default r;
