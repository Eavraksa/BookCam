require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { HttpError } = require('./utils/http');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/books', require('./routes/books'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.code === 'auth/user-not-found') return res.status(404).json({ error: 'User not found' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`BookCam API listening on http://localhost:${port}`));
