import { Router } from 'express';
import * as ctrl from '../controllers/tenant.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate, authorize('superadmin'));
r.get('/', ctrl.list);
r.get('/:id', ctrl.getOne);
r.post('/', ctrl.create);
r.put('/:id', ctrl.update);
export default r;
