import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'nestfinder-server' });
});

app.listen(PORT, () => {
  console.log(`NestFinder API running on http://localhost:${PORT}`);
});
