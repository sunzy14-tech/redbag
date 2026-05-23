const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const strategyRoutes = require('./routes/strategies');
const batchRoutes = require('./routes/batches');
const scanRoutes = require('./routes/scan');
const { errorHandler } = require('./middleware/error');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 300 }));

app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/auth', authRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/admin/strategies', strategyRoutes);
app.use('/api/admin/batches', batchRoutes);
app.use('/api/scan', scanRoutes);
app.use(errorHandler);

module.exports = app;

