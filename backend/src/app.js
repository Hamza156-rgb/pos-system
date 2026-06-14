import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting (global + stricter on auth)
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { success: false, message: 'Too many login attempts, try again later' } });
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date() }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
