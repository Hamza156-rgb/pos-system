import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { validate } from '../middlewares/validate.js';

const r = Router();
r.use(authenticate, authorize('admin'));
r.get('/', ctrl.list);
r.post('/', [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 }), body('role').isIn(['admin', 'cashier'])], validate, ctrl.create);
r.put('/:id', ctrl.update);
r.delete('/:id', ctrl.remove);
export default r;
