import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Lead } from '../models/Lead.js';
import { Listing } from '../models/Listing.js';
import { httpError } from '../lib/errors.js';
import { notifyNewLead } from '../lib/notify.js';

const router = Router();

const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many enquiries, please try again later' },
});

// Accepts "98765 43210", "+91 9876543210", "09876543210" -> "9876543210".
export function normalizeIndianPhone(input) {
  const digits = String(input ?? '').replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

// POST /api/leads  { listing: "NF-001", name, phone, message?, visitDate? }
router.post('/', leadLimiter, async (req, res) => {
  const { listing: code, name, phone, message, visitDate } = req.body ?? {};
  if (!name?.trim()) throw httpError(400, 'Name is required');
  const cleanPhone = normalizeIndianPhone(phone);
  if (!cleanPhone) throw httpError(400, 'Enter a valid 10-digit Indian mobile number');

  let visit;
  if (visitDate) {
    visit = new Date(visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today.getTime() + 60 * 86400000);
    if (Number.isNaN(visit.getTime()) || visit < today || visit > maxDate) {
      throw httpError(400, 'Pick a visit date within the next 60 days');
    }
  }

  const listing = await Listing.findOne({ code: String(code ?? '') }, 'broker code bhk locality rent');
  if (!listing) throw httpError(404, 'Listing not found');
  if (!listing.broker) throw httpError(409, 'This listing is not taking enquiries');

  const lead = await Lead.create({
    listing: listing._id,
    broker: listing.broker,
    name,
    phone: cleanPhone,
    message,
    visitDate: visit,
    status: visit ? 'visit_scheduled' : 'new',
  });
  res.status(201).json({ ok: true, id: lead._id });

  // Alert the broker after responding, so a slow or failing push/Telegram call never blocks the enquiry.
  notifyNewLead(listing, lead).catch((err) => console.error('Lead alert failed:', err.message));
});

export default router;
