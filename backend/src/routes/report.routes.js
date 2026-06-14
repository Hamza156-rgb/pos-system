import { Router } from 'express';
import * as ctrl from '../controllers/report.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate, authorize('admin'));
r.get('/sales', ctrl.salesReport);
r.get('/inventory', ctrl.inventoryReport);
r.get('/financial', ctrl.financialReport);
export default r;
