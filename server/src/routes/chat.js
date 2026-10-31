import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Listing } from '../models/Listing.js';
import { httpError } from '../lib/errors.js';
import { techParks } from '../lib/geo.js';
import { completeJson, completeText, llmEnabled } from '../lib/llm.js';
import { scoreListing } from '../lib/match.js';
import { parsePrefs } from './match.js';

const router = Router();

// Groq's free tier has its own limits; this keeps one visitor from using them all.
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'You are sending messages very fast. Please wait a few minutes.' },
});

const PARK_NAMES = techParks.map((t) => t.name);
const nullable = (type, extra = {}) => ({ type: [type, 'null'], ...extra });

// Step 1 output: what the person told us, in a fixed shape the scoring engine understands.
const EXTRACT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['techPark', 'budget', 'bhk', 'tenant', 'furnishing', 'pets', 'gym', 'quiet', 'car', 'metro', 'language', 'onTopic'],
  properties: {
    techPark: { anyOf: [{ type: 'string', enum: PARK_NAMES }, { type: 'null' }] },
    budget: nullable('integer'),
    bhk: nullable('integer'),
    tenant: { anyOf: [{ type: 'string', enum: ['Bachelors', 'Family'] }, { type: 'null' }] },
    furnishing: { anyOf: [{ type: 'string', enum: ['Unfurnished', 'Semi-furnished', 'Fully furnished'] }, { type: 'null' }] },
    pets: nullable('boolean'),
    gym: nullable('boolean'),
    quiet: nullable('boolean'),
    car: nullable('boolean'),
    metro: nullable('boolean'),
    language: { type: 'string', enum: ['English', 'Hindi', 'Hinglish'] },
    onTopic: { type: 'boolean' },
  },
};

const EXTRACT_PROMPT = `You read messages from someone looking for a rented flat in Bengaluru and update their preferences.
Messages may be in English, Hindi (Devanagari) or Hinglish (Hindi in Latin script).

Return every field. Use null when the conversation does not mention it; keep earlier answers unless the person changes them.
- techPark: their office, mapped to one of: ${PARK_NAMES.join(', ')}.
  Hints: Hebbal/Nagawara office -> Manyata Tech Park; Whitefield/ITPL -> ITPL Whitefield; Electronic City/Infosys/Wipro EC -> Electronic City;
  CV Raman Nagar/Old Airport Road -> Bagmane Tech Park; Outer Ring Road/Bellandur/Ecospace side -> Embassy Tech Village;
  Marathahalli/Kadubeesanahalli -> Prestige Tech Park. If they work from home or the office is elsewhere, null.
- budget: monthly rent in rupees as an integer ("25k" = 25000, "1.2 lakh" = 120000). If they give a range, use the top.
- bhk: 1, 2 or 3, only when they say it ("single room"/"1RK" = 1). Do not guess it from living alone or family size.
- tenant: only when they say who will live there. "Bachelors" for someone living alone, students or friends sharing; "Family" for couples or families. Do not guess from their job.
- pets: true if they have or plan to have a pet; false if they say no pets.
- gym, quiet, car (needs car parking), metro (wants metro nearby): true only if they ask for it; false if they say they don't care.
- language: the language of their latest message. Choose "Hinglish" only when it clearly uses Hindi words in Latin letters; if unsure, "English".
- onTopic: false only if the latest message has nothing to do with finding or renting a flat.`;

const REPLY_PROMPT = `You are NestFinder, a friendly flat-finding assistant for Bengaluru. This is a demo with sample listings.
Reply in the language named in LANGUAGE. Hinglish means casual Hindi written only in Latin letters (never Devanagari); Hindi means Devanagari.
Plain text only: no markdown, no tables, no "|" separators, no bullet symbols. Write each flat as one short natural sentence. Keep it under 110 words.
Use ONLY the facts in TOP_MATCHES and PREFERENCES. Never invent flats, prices, distances or amenities. Distances are straight-line and approximate.
Each flat lists its amenities and every reason ("good", "warn", "bad"). If a flat misses something they asked for, say so plainly for that flat;
never claim the data is missing. Do not write the words "good", "warn" or "bad"; turn them into natural phrases.
Structure: one short line showing you understood them (restate only what is in PREFERENCES, nothing else); then the top 2-3 flats, each with code, area, rent, match % and the main reason or concern;
then, if KEY_MISSING is not empty, ask one short question about the most useful missing detail.
If ON_TOPIC is false, politely say you can only help with finding flats in Bengaluru.`;

const clean = (s, max) => String(s ?? '').slice(0, max);

// POST /api/chat  { messages: [{ role: 'user'|'assistant', content }], prefs: { ...current } }
router.post('/', chatLimiter, async (req, res) => {
  if (!llmEnabled()) throw httpError(503, 'The AI assistant is not set up on this server');
  const history = (Array.isArray(req.body?.messages) ? req.body.messages : [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-8)
    .map((m) => ({ role: m.role, content: clean(m.content, 600) }));
  if (history.at(-1)?.role !== 'user' || !history.at(-1).content.trim()) throw httpError(400, 'Type a message first');

  // Current form values (from the URL) are given to the model so it can keep or change them.
  let current = {};
  try {
    current = parsePrefs(req.body?.prefs ?? {});
  } catch {
    current = {};
  }

  // 1. Understand: plain words -> structured preferences.
  const extracted = await completeJson(
    [
      { role: 'system', content: EXTRACT_PROMPT },
      { role: 'system', content: `Current preferences: ${JSON.stringify(current)}` },
      ...history,
    ],
    'flat_preferences',
    EXTRACT_SCHEMA,
  );
  const { onTopic, ...fields } = extracted;
  delete fields.language;
  // Script decides Hindi vs not, which is more reliable than asking the model: Devanagari = Hindi,
  // Latin letters = English or Hinglish (the model only tells those two apart).
  const latest = history.at(-1).content;
  const language = /[ऀ-ॿ]/.test(latest) ? 'Hindi' : extracted.language === 'English' ? 'English' : 'Hinglish';
  // Merge onto the current form: null = not mentioned (keep), false = "don't need it" (drop), value = set.
  const merged = { ...current };
  for (const [key, value] of Object.entries(fields)) {
    if (value === false) delete merged[key];
    else if (value !== null) merged[key] = value;
  }
  // Re-validate what the model returned with the same rules as the form; drop anything invalid.
  let safePrefs = current;
  if (onTopic) {
    try {
      safePrefs = parsePrefs(Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, String(v)])));
    } catch {
      safePrefs = current;
    }
  }

  // 2. Score: the same deterministic engine as /api/match.
  let top = [];
  if (Object.keys(safePrefs).length) {
    const listings = await Listing.find({}, '-description -location -createdAt -updatedAt -__v').lean();
    top = listings
      .map((l) => ({ ...l, match: scoreListing(l, safePrefs) }))
      .sort((a, b) => b.match.score - a.match.score || a.rent - b.rent)
      .slice(0, 3);
  }
  const keyMissing = ['techPark', 'budget', 'tenant'].filter((k) => !(k in safePrefs));

  // 3. Explain: the model writes the reply using only the facts we pass in.
  const facts = top.map((l) => ({
    code: l.code,
    area: l.locality,
    bhk: l.bhk,
    rent: l.rent,
    deposit_months: l.depositMonths,
    match_percent: l.match.score,
    amenities: l.amenities,
    reasons: l.match.reasons.map((r) => `${r.tone}: ${r.text}`),
  }));
  const reply = await completeText([
    { role: 'system', content: REPLY_PROMPT },
    ...history,
    {
      role: 'system',
      content: `LANGUAGE: ${language}\nON_TOPIC: ${onTopic}\nPREFERENCES: ${JSON.stringify(safePrefs)}\nKEY_MISSING: ${keyMissing.join(', ') || 'none'}\nTOP_MATCHES: ${JSON.stringify(facts)}`,
    },
  ]);

  res.json({
    reply: reply.trim(),
    prefs: safePrefs,
    matches: top.map((l) => ({ code: l.code, locality: l.locality, bhk: l.bhk, rent: l.rent, score: l.match.score })),
  });
});

export default router;
