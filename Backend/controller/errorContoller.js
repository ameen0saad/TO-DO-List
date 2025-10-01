import AppError from '../utils/AppError.js';

const handleNorecordError = () => new AppError('There is no data with that ID ', 404);
const handleDublicateFoield = (err) =>
  new AppError(`Duplicate field value: ${err.meta?.target}`, 400);
const handleJWTError = () => new AppError('Invalid Token please Log in', 401);
const handleJWTExpires = () => new AppError('Yor Token has expired please log in again', 401);

const sendErrorprod = (err, req, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};
const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'production') {
    if (err.code == 'P2025') err = handleNorecordError();
    if (err.code == 'P2002') err = handleDublicateFoield(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleJWTExpires();
    sendErrorprod(err, req, res);
  } else {
    sendErrorDev(err, req, res);
  }
};
export default globalErrorHandler;
