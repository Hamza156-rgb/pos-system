import { Router } from 'express';
import * as ctrl from '../controllers/ledger.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { requirePermission } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate);
r.get('/customer/:id', requirePermission('customers'), ctrl.customerLedger);
r.get('/supplier/:id', requirePermission('suppliers'), ctrl.supplierLedger);
export default r;
