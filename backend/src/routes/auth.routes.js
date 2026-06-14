import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const r = Router();
r.post('/login', [body('email').isEmail(), body('password').notEmpty()], validate, ctrl.login);
r.post('/refresh', ctrl.refresh);
r.post('/logout', authenticate, ctrl.logout);
r.get('/me', authenticate, ctrl.me);
export default r;
