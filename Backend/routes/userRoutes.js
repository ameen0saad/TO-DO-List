import express from 'express';
import rateLimit from 'express-rate-limit';

import * as authController from '../controller/authController.js';
import * as oauthController from '../controller/oauthController.js';

const loginLimiter = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: JSON.stringify({
    status: 429,
    message: 'Too many login attempts, please try again after 15 minutes.',
  }),
});

const forgetPasswordLimiter = rateLimit({
  max: 3,
  windowMs: 60 * 60 * 1000,
  message: JSON.stringify({
    status: 429,
    message: 'Too many password reset requests from this IP, please try again after an hour.',
  }),
});
const router = express.Router();

router.post('/login', loginLimiter, authController.login);
router.get('/logout', authController.logout);

router.post('/signup', authController.signUp);

router.post('/forgetPassword', forgetPasswordLimiter, authController.forgetPassword);
router.post('/verifyOTP', authController.verifyOtp);
router.patch('/resetPassword', authController.resetPassword);

router.patch('/updatePassword', authController.protect, authController.updatePassword);
router.get('/me', authController.protect, authController.myProfile);

// TODO : oauth by goole
router.get('/auth/google', oauthController.googleAuth);
router.get('/auth/google/callback', oauthController.googleAuthCallback);

router.get('/:id/verifyEmail/:token', authController.verifyEmail);

export default router;

//497caac1-03de-4ec3-b6e1-f783db72257a
//ca550fe6-0dfb-4f20-a17e-916c6caf5240
