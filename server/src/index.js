import express from 'express';
import cors from 'cors';
import { connectDb } from './db.js';
import listingsRouter from './routes/listings.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'nestfinder-server' });
});

app.use('/api/listings', listingsRouter);

// Express 5 forwards errors thrown in async handlers here.
app.use((err, req, res, next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Something went wrong' });
});

await connectDb();
app.listen(PORT, () => {
  console.log(`NestFinder API running on http://localhost:${PORT}`);
});
