import jwt from 'jsonwebtoken';
import { httpError } from '../lib/errors.js';

export const COOKIE_NAME = 'nf_token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function secret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set. Add it to server/.env');
  return process.env.JWT_SECRET;
}

// The token lives in an httpOnly cookie, so page JavaScript (and any XSS) cannot read it.
// In production the client calls /api through a Vercel rewrite, so the cookie stays same-site.
export function setAuthCookie(res, brokerId) {
  const token = jwt.sign({ sub: String(brokerId) }, secret(), { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_MS,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
}

// The logged-in broker's id from the cookie, or null when there is no valid session.
export function brokerIdFrom(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, secret()).sub;
  } catch {
    return null;
  }
}

// Puts the logged-in broker's id on req.brokerId, or rejects with 401.
export function requireBroker(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next(httpError(401, 'Please log in'));
  try {
    req.brokerId = jwt.verify(token, secret()).sub;
    next();
  } catch {
    next(httpError(401, 'Session expired, please log in again'));
  }
}
