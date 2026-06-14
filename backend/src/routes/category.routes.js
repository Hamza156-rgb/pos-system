import { Router } from 'express';
import * as ctrl from '../controllers/category.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate);
r.get('/', ctrl.list);
r.post('/', authorize('admin'), ctrl.create);
r.put('/:id', authorize('admin'), ctrl.update);
r.delete('/:id', authorize('admin'), ctrl.remove);
export default r;
