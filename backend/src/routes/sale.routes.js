import { Router } from 'express';
import * as ctrl from '../controllers/sale.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';

const r = Router();
r.use(authenticate);
r.get('/', ctrl.list);                       // cashiers see sales (use ?today=true)
r.get('/cash-closing', ctrl.cashClosing);
r.get('/:id', ctrl.getOne);
r.post('/', ctrl.create);                    // admin + cashier can sell
r.post('/sync', ctrl.sync);                  // offline queue sync
export default r;
