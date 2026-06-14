import { Router } from 'express';
import * as ctrl from '../controllers/report.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate, requirePermission('reports'));
r.get('/sales', ctrl.salesReport);
r.get('/inventory', ctrl.inventoryReport);
r.get('/financial', ctrl.financialReport);
r.get('/profit-loss', ctrl.profitLoss);
r.get('/top-products', ctrl.topProducts);
r.get('/payment-methods', ctrl.paymentMethods);
r.get('/sales-by-category', ctrl.salesByCategory);
r.get('/returns', ctrl.returnsReport);
r.get('/receivables', ctrl.receivables);
r.get('/payables', ctrl.payables);
export default r;
