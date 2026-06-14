import { Router } from 'express';
import * as dashboard from '../controllers/dashboard.controller.js';
import * as setting from '../controllers/setting.controller.js';
import * as audit from '../controllers/audit.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';

const r = Router();
r.get('/dashboard', authenticate, dashboard.stats);
r.get('/settings', authenticate, setting.get);
r.put('/settings', authenticate, authorize('admin'), setting.update);
r.get('/audit-logs', authenticate, authorize('admin'), audit.list);
export default r;
