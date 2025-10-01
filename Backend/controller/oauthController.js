import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';
import { Strategy } from 'passport-google-oauth2';

import AppError from '../utils/AppError.js';

const prisma = new PrismaClient();
const signToken = (id, expires) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expires,
  });

passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        'https://to-do-list-production-5d26.up.railway.app/api/v1/users/auth/google/callback',
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });
        if (!user)
          user = await prisma.user.create({
            data: {
              name: profile.displayName,
              email: profile.emails[0].value,
              password: null,
              verified: true,
            },
          });
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

export const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      console.error('OAuth Error:', err);
      return next(new AppError('Google authentication failed', 401));
    }
    if (!user) {
      return next(new AppError('Login failed - no user found', 401));
    }
    const token = signToken(user.id, process.env.JWT_EXPIRES_IN);

    const cookieOption = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV == 'production',
    };

    res.cookie('jwt', token, cookieOption);

    res.redirect(`https://to-do-list-q.netlify.app/Dashboard/index.html`);
  })(req, res, next);
};
