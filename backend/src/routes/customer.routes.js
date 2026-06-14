import { Router } from 'express';
import * as ctrl from '../controllers/customer.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate);
r.get('/', ctrl.list);
r.get('/:id', ctrl.getOne);
r.post('/', ctrl.create);
r.put('/:id', ctrl.update);
r.post('/:id/settle', ctrl.settleCredit);
r.delete('/:id', authorize('admin'), ctrl.remove);
export default r;
