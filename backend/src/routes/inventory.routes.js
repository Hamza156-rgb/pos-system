import { Router } from 'express';
import * as ctrl from '../controllers/inventory.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate);
r.get('/movements', ctrl.movements);
r.get('/low-stock', ctrl.lowStock);
r.post('/adjust', authorize('admin'), ctrl.adjust);
export default r;
