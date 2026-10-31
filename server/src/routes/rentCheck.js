import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Listing } from '../models/Listing.js';
import { httpError } from '../lib/errors.js';
import { checkRent } from '../lib/fairRent.js';
import { localities } from '../lib/geo.js';
import { completeJson, completeText, llmEnabled } from '../lib/llm.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many checks, please wait a few minutes.' },
});

const AREAS = localities.map((l) => l.name);
const FURNISHING = ['Unfurnished', 'Semi-furnished', 'Fully furnished'];
const nullable = (type) => ({ type: [type, 'null'] });

const EXTRACT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['locality', 'bhk', 'rent', 'depositAmount', 'depositMonths', 'maintenance', 'furnishing'],
  properties: {
    locality: { anyOf: [{ type: 'string', enum: AREAS }, { type: 'null' }] },
    bhk: nullable('integer'),
    rent: nullable('integer'),
    depositAmount: nullable('integer'),
    depositMonths: nullable('number'),
    maintenance: nullable('integer'),
    furnishing: { anyOf: [{ type: 'string', enum: FURNISHING }, { type: 'null' }] },
  },
};

const EXTRACT_PROMPT = `Read a rental offer for a flat in Bengaluru (often a broker's WhatsApp message, in English, Hindi or Hinglish) and pull out the terms.
Return every field; use null when the message does not say it. Amounts are rupees as integers ("45k" = 45000, "2.5L"/"2.5 lakh" = 250000).
- locality: map the area to the closest one of: ${AREAS.join(', ')}. Hints: Kasavanahalli/Haralur/Dommasandra -> Sarjapur Road; Kadubeesanahalli/Panathur -> Bellandur;
  Brookefield/ITPL/Hoodi -> Whitefield; HRBR/Kammanahalli -> Kalyan Nagar; Bommanahalli/Begur -> Hulimavu; Nagawara -> Hebbal; Sahakar Nagar -> Hebbal.
  If the area is not in or near Bengaluru, null.
- rent: monthly rent. maintenance: monthly maintenance if stated separately.
- depositAmount: deposit in rupees if given as an amount; depositMonths: if given as months ("10 months advance" = 10).
- furnishing: semi/fully/unfurnished if stated.`;

// The facts are in English, so the model drifts to English unless the language rule comes first, with an example.
const LANGUAGE_RULE = {
  English: 'Write the whole message in English.',
  Hinglish:
    'Write the whole message in Hinglish: Hindi sentences written in Latin letters, the way people text on WhatsApp in Bengaluru, ' +
    'with English words only for things like rent, deposit, BHK. Example tone: "Namaste sir, flat bahut pasand aaya. Kya rent thoda kam ho sakta hai?" ' +
    'Never write it fully in English and never use Devanagari.',
};

const NEGOTIATE_PROMPT = `Write a short, polite message a tenant can send to a broker in Bengaluru to negotiate.
WhatsApp style, plain text, no markdown, under 90 words, no greeting placeholders like [Name].
Use ONLY the numbers in FACTS. Be friendly and show genuine interest in the flat.
If RENT_IS_HIGH is true: mention that similar flats nearby go for around the median, then propose the target rent (and the target deposit if given).
If RENT_IS_HIGH is false: do not mention the median or say the rent is fair or cheap (that only helps the broker raise it); just ask to bring the deposit down to the target.`;

function validate(f) {
  const missing = [];
  if (!AREAS.includes(f.locality)) missing.push('locality');
  if (![1, 2, 3].includes(f.bhk)) missing.push('bhk');
  if (!Number.isFinite(f.rent) || f.rent < 3000 || f.rent > 500000) missing.push('rent');
  if (f.depositMonths != null && (!Number.isFinite(f.depositMonths) || f.depositMonths < 0 || f.depositMonths > 24)) missing.push('depositMonths');
  if (f.furnishing != null && !FURNISHING.includes(f.furnishing)) missing.push('furnishing');
  return missing;
}

const toNumber = (v) => (v === '' || v == null ? null : Number(v));

// POST /api/rent-check  { text?, fields?: { locality, bhk, rent, depositMonths, furnishing, maintenance }, language?: 'English'|'Hinglish' }
router.post('/', limiter, async (req, res) => {
  const text = String(req.body?.text ?? '').trim().slice(0, 1500);
  const given = req.body?.fields ?? {};
  const language = req.body?.language === 'Hinglish' ? 'Hinglish' : 'English';

  // 1. Read the broker's message (only when there is one; edits to the fields skip this).
  let fields = {};
  if (text) {
    if (!llmEnabled()) throw httpError(503, 'Reading messages needs the AI assistant, which is not set up. Fill in the details instead.');
    const x = await completeJson([{ role: 'system', content: EXTRACT_PROMPT }, { role: 'user', content: text }], 'rental_offer', EXTRACT_SCHEMA);
    fields = {
      locality: x.locality,
      bhk: x.bhk,
      rent: x.rent,
      maintenance: x.maintenance,
      furnishing: x.furnishing,
      depositMonths: x.depositMonths ?? (x.depositAmount && x.rent ? Math.round((x.depositAmount / x.rent) * 2) / 2 : null),
    };
  }
  // Values typed in the form win over what the model read.
  for (const key of ['locality', 'bhk', 'rent', 'depositMonths', 'furnishing', 'maintenance']) {
    if (given[key] !== undefined && given[key] !== '') fields[key] = ['bhk', 'rent', 'depositMonths', 'maintenance'].includes(key) ? toNumber(given[key]) : given[key];
  }
  for (const key of ['locality', 'bhk', 'rent', 'depositMonths', 'furnishing', 'maintenance']) fields[key] ??= null;

  const missing = validate(fields);
  if (missing.length) return res.status(422).json({ error: 'Some details are missing or unclear', fields, missing });

  // 2. Compare with similar sample flats (rules, no LLM).
  // When checking one of our own flats, leave it out so it is not compared with itself.
  const exclude = typeof req.body?.exclude === 'string' ? req.body.exclude : null;
  const listings = await Listing.find(exclude ? { code: { $ne: exclude } } : {}, 'code locality bhk rent depositMonths furnishing sqft').lean();
  const result = checkRent(fields, listings, localities);
  if (!result.enough) return res.json({ fields, result, message: null });

  // 3. Draft a negotiation message only when there is something to negotiate.
  const rentHigh = ['slightly_high', 'high'].includes(result.rent.verdict.level);
  const depositHigh = result.deposit?.aboveTypical;
  let message = null;
  if ((rentHigh || depositHigh) && llmEnabled()) {
    const facts = {
      flat: `${fields.bhk}BHK in ${fields.locality}`,
      asked_rent: fields.rent,
      ...(rentHigh && {
        similar_flats_compared: result.count,
        median_rent_of_similar_flats: result.rent.median,
        target_rent: result.target.rent,
      }),
      asked_deposit_months: result.deposit?.months ?? 'not stated',
      typical_deposit_months: result.deposit?.typicalMonths ?? 'n/a',
      target_deposit_months: depositHigh ? result.target.depositMonths : 'no change needed',
    };
    message = (
      await completeText([
        { role: 'system', content: `${LANGUAGE_RULE[language]}\n\n${NEGOTIATE_PROMPT}` },
        { role: 'user', content: `RENT_IS_HIGH: ${rentHigh}\nFACTS: ${JSON.stringify(facts)}\n\nRemember: ${LANGUAGE_RULE[language]}` },
      ], 400)
    ).trim();
  }

  res.json({ fields, result, message, language });
});

export default router;
