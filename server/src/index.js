import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDb } from './db.js';
import listingsRouter from './routes/listings.js';
import authRouter from './routes/auth.js';
import leadsRouter from './routes/leads.js';
import brokerRouter from './routes/broker.js';
import matchRouter from './routes/match.js';
import chatRouter from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Render (and Vercel's rewrite) sit in front of the app; trust one proxy hop so
// rate limiting sees the real client IP instead of the proxy's.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'nestfinder-server' });
});

app.use('/api/listings', listingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/broker', brokerRouter);
app.use('/api/match', matchRouter);
app.use('/api/chat', chatRouter);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Express 5 forwards errors thrown in async handlers here.
app.use((err, req, res, next) => {
  // Mongoose rejects bad field values (wrong enum, missing required field) as a 400.
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    const first = err.errors ? Object.values(err.errors)[0].message : err.message;
    return res.status(400).json({ error: first });
  }
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong' });
});

await connectDb();
app.listen(PORT, () => {
  console.log(`NestFinder API running on http://localhost:${PORT}`);
});
