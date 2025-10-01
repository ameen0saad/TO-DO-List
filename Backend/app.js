import express from 'express';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import morgan from 'morgan';
import cors from 'cors';
import globalErrorHandler from './controller/errorContoller.js';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import { xss } from 'express-xss-sanitizer';

import AppError from './utils/AppError.js';
const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  max: 1001,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);
app.use(xss());
app.use(hpp({ whitelist: ['sort', 'limit', 'page', 'fields', 'search', 'include'] }));
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/users', userRoutes);
app.all('*split', (req, res, next) => {
  return next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);
export default app;
