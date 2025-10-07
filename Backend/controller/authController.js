import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';

import { __dirname } from '../utils/path.js';
import crypto from 'crypto';
import AppError from '../utils/AppError.js';
import Email from '../utils/email.js';
import path from 'path';

const prisma = new PrismaClient();

// TODO : Hash password function
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const signToken = (id, expires) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expires,
  });
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id, process.env.JWT_EXPIRES_IN);

  const cookieOption = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV == 'production',
    sameSite: 'none',
  };

  res.cookie('jwt', token, cookieOption);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user,
    },
  });
};

// TODO : signUp --> Have to verify Email
export const signUp = async (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password || !confirmPassword)
    return next(new AppError('Please provide name, email, password and confirmPassword', 400));

  if (password !== confirmPassword) return next(new AppError('Password are not the same !'));

  if (!validator.isEmail(email)) return next(new AppError('Please provide a valid email', 400));
  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters', 400));
  }
  if (name.length < 3 || name.length > 30)
    return next(new AppError('Name must be between 3 and 30 characters', 400));

  const hashPass = await hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      password: hashPass,
    },
  });
  const VerificationToken = await prisma.verificationToken.create({
    data: {
      token: crypto.randomBytes(32).toString('hex'),
      userId: newUser.id,
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/users/${
    newUser.id
  }/verifyEmail/${VerificationToken.token}`;
  await new Email(newUser, verificationUrl).sendVerification();
  res.status(201).json({
    status: 'Success',
    message: 'User created successfully! Please check your email to verify your account',
  });
};

// TODO : Log in
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!validator.isEmail(email)) return next(new AppError('Please provide a valid email', 400));

  if (!email || !password) return next(new AppError('Please provide email and password', 400));

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password || !(await bcrypt.compare(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  if (!user.verified) {
    let VerificationToken = await prisma.verificationToken.findFirst({
      where: { userId: user.id },
    });

    if (!VerificationToken || VerificationToken.tokenExpiry < new Date()) {
      VerificationToken = await prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: crypto.randomBytes(32).toString('hex'),
          tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
    }
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/users/${
      user.id
    }/verifyEmail/${VerificationToken.token}`;

    await new Email(user, verificationUrl).sendVerification();
    return next(new AppError('Please verify your email to login', 401));
  }

  createSendToken(user, 200, res);
};

//TODO : Logout
export const logout = async (req, res, next) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(0),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'Success',
    message: 'Logged out successfully',
  });
};

// TODO : Protect "middleware"
export const protect = async (req, res, next) => {
  // TODO : get Token and check if exist
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;

  if (!token) return next(new AppError('You are not Logged in ! please log in to get access', 401));

  //TODO : Verify Token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // TODO : Get User after verify Token
  const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (!currentUser)
    return next(new AppError('The user belonging to this token no longer exists', 401));

  // TODO :  check if user changed password after token was issued
  if (currentUser.passwordChangedAt) {
    const changedTimestamp = parseInt(currentUser.passwordChangedAt.getTime() / 1000, 10);

    if (decoded.iat < changedTimestamp) {
      return next(new AppError('User recently changed password! Please log in again.', 401));
    }
  }

  req.user = currentUser;
  next();
};

export const myProfile = async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { name: true, email: true, id: true },
  });
  res.status(200).json({
    status: 'Success',
    data: {
      user,
    },
  });
};

export const updatePassword = async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword)
    return next(new AppError('Please provide , password and confirmPassword', 400));

  if (password !== confirmPassword) return next(new AppError('Password are not the same !'));

  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters', 400));
  }

  const hashPass = await hashPassword(password);
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      password: hashPass,
      passwordChangedAt: new Date(),
    },
  });

  createSendToken(user, 200, res);
};

// TODO : Forget Password
export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next(new AppError('Polease provide your email', 400));

  if (!validator.isEmail(email)) return next(new AppError('Please provide a valid email', 400));

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return next(new AppError('There is no user with that email address', 400));

  // TODO : create random otp with 6 Digits
  const otp = crypto.randomInt(10 ** 5, 10 ** 6).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  const hashOtp = await bcrypt.hash(otp, 12);

  const OTP = await prisma.otp.create({
    data: {
      otp: hashOtp,
      otpExpiry: otpExpires,
      userId: user.id,
    },
  });

  // TODO : send email
  await new Email(user, null).sendOtp(otp);

  // TODO : after email is sent
  const token = signToken(OTP.id, process.env.SESSION_EXPIRES);

  const cookieOption = {
    expires: new Date(Date.now() + 10 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
  };

  res.cookie('otp_session', token, cookieOption);

  res.status(200).json({
    status: 'Success',
    message: 'OTP sent to email!',
  });
};

// TODO : verify OTP
export const verifyOtp = async (req, res, next) => {
  const { otp } = req.body;
  if (!otp) return next(new AppError('Please provide your OTP', 400));

  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
    token = req.headers.authorization.split(' ')[1];
  else if (req.cookies.otp_session) token = req.cookies.otp_session;

  if (!token) return next(new AppError('Session expired or invalid', 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const OTP = await prisma.otp.findUnique({ where: { id: decoded.id } });

  if (!OTP) return next(new AppError('The OTP session is invalid, please request a new one', 401));

  if (OTP.otpExpiry < new Date())
    return next(new AppError('The OTP has expired, please request a new one', 400));

  if (!(await bcrypt.compare(otp, OTP.otp)))
    return next(new AppError('The OTP is incorrect, please try again', 400));

  const user = await prisma.user.findUnique({ where: { id: OTP.userId } });
  if (!user) return next(new AppError('User no longer exists', 404));

  await prisma.otp.delete({ where: { id: OTP.id } });

  const autToken = signToken(user.id, process.env.SESSION_EXPIRES);

  const cookieOption = {
    expires: new Date(Date.now() + 15 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
  };

  res.cookie('reset_session', autToken, cookieOption);
  res.status(200).json({
    status: 'Success',
    token: autToken,
  });
};

// TODO : reset password
export const resetPassword = async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword)
    return next(new AppError('Please provide password and confirmPassword', 400));

  if (password !== confirmPassword) return next(new AppError('Password are not the same !'));

  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters', 400));
  }
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
    token = req.headers.authorization.split(' ')[1];
  else if (req.cookies.reset_session) token = req.cookies.reset_session;

  if (!token) return next(new AppError('Session expired or invalid', 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (currentUser.password) {
    if (await bcrypt.compare(password, currentUser.password))
      return next(new AppError('New password must be different from current password', 400));
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.update({
    where: { id: decoded.id },
    data: { password: hashedPassword, passwordChangedAt: new Date() },
  });

  if (!user) return next(new AppError('User no longer exists', 404));
  res.cookie('reset_session', 'endreset', {
    expires: new Date(0),
    httpOnly: true,
  });

  createSendToken(user, 200, res);
};

// TODO : verify Email
export const verifyEmail = async (req, res, next) => {
  const userId = req.params.id;
  const token = req.params.token;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return next(new AppError('User not found', 404));

  const VerificationToken = await prisma.verificationToken.findFirst({ where: { token, userId } });

  if (!VerificationToken) return next(new AppError('Invalid Link or expired', 400));

  if (VerificationToken.tokenExpiry < new Date())
    return next(new AppError('Token has expired', 400));
  await prisma.user.update({ where: { id: userId }, data: { verified: true } });
  await prisma.verificationToken.deleteMany({ where: { userId } });

  const url = `${req.protocol}://${req.get('host')}/myProfile`;
  await new Email(user, url).sendWelcome();

  res.sendFile(path.join(__dirname, '../public/html/email/verifyEmailSuccess.html'));
};
