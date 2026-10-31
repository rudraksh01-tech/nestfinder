import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Broker } from '../models/Broker.js';
import { httpError } from '../lib/errors.js';
import { clearAuthCookie, requireBroker, setAuthCookie } from '../middleware/auth.js';

const router = Router();

// Slows down password guessing: 10 failed attempts per 15 minutes per IP.
// Successful logins are not counted, so a real user is never locked out by logging in often.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many failed attempts, please try again in a few minutes' },
});
// Limits account creation: 5 per hour per IP.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many sign-ups from this network, please try again later' },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', registerLimiter, async (req, res) => {
  const { name, email, password, phone, agency } = req.body ?? {};
  if (!name?.trim()) throw httpError(400, 'Name is required');
  if (!EMAIL_RE.test(email ?? '')) throw httpError(400, 'Enter a valid email');
  if (typeof password !== 'string' || password.length < 8) throw httpError(400, 'Password must be at least 8 characters');
  if (await Broker.exists({ email: email.toLowerCase().trim() })) throw httpError(409, 'An account with this email already exists');

  const broker = new Broker({ name, email, phone, agency });
  await broker.setPassword(password);
  await broker.save();
  setAuthCookie(res, broker._id);
  res.status(201).json({ broker });
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body ?? {};
  const broker = email && (await Broker.findOne({ email: String(email).toLowerCase().trim() }));
  // Same message for unknown email and wrong password, so emails cannot be probed.
  if (!broker || !(await broker.checkPassword(String(password ?? '')))) throw httpError(401, 'Wrong email or password');
  setAuthCookie(res, broker._id);
  res.json({ broker });
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireBroker, async (req, res) => {
  const broker = await Broker.findById(req.brokerId);
  if (!broker) {
    clearAuthCookie(res);
    throw httpError(401, 'Please log in');
  }
  res.json({ broker });
});

export default router;
