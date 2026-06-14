import logger from '../utils/logger.js';

export const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = err.errors?.[0]?.message || 'Duplicate entry';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors?.map((e) => e.message).join(', ');
  }

  if (statusCode >= 500) logger.error(err.stack || err.message);
  else logger.warn(`${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || undefined,
    ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};
