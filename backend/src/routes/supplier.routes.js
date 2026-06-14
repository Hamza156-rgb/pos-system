import { Router } from 'express';
import * as ctrl from '../controllers/supplier.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate, authorize('admin'));
r.get('/', ctrl.list);
r.get('/:id', ctrl.getOne);
r.post('/', ctrl.create);
r.put('/:id', ctrl.update);
r.delete('/:id', ctrl.remove);
export default r;
