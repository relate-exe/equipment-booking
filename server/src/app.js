const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1); // needed behind Render/Railway/Heroku proxies

const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(helmet());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '10kb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use(
  '/api/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, message: { success: false, message: 'Too many attempts, try again later' } })
);

app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/bookings', require('./routes/bookings'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
