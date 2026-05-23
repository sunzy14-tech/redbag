const path = require('path');
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
const adminPublicDir = path.resolve(__dirname, '..', 'public', 'admin');

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 300 }));

function renderStatusPage() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redbag API Health</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f7f8fa; color: #1a1a1a; }
    main { width: min(520px, calc(100vw - 32px)); background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 28px; box-shadow: 0 18px 60px rgba(15, 23, 42, .08); }
    .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: #ecfdf5; color: #047857; font-weight: 700; font-size: 13px; }
    h1 { margin: 18px 0 8px; font-size: 26px; line-height: 1.2; }
    p { margin: 0; color: #64748b; line-height: 1.7; }
    code { display: block; margin-top: 18px; padding: 14px; border-radius: 10px; background: #0f172a; color: #d1fae5; white-space: pre-wrap; }
  </style>
</head>
<body>
  <main>
    <div class="badge">OK Service Online</div>
    <h1>商户品牌红包 API 正常运行</h1>
    <p>后端、Nginx 与 HTTPS 已可访问。小程序可以使用当前域名作为 API 地址。</p>
    <code>{"success":true,"data":{"status":"ok"}}</code>
  </main>
</body>
</html>`;
}

app.get('/', (_req, res) => {
  res.type('html').send(renderStatusPage());
});

app.get('/health', (req, res) => {
  if ((req.headers.accept || '').includes('text/html')) {
    return res.type('html').send(renderStatusPage());
  }
  res.json({ success: true, data: { status: 'ok' } });
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(adminPublicDir, 'index.html'));
});
app.use('/admin', express.static(adminPublicDir));

app.use('/api/auth', authRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/admin/strategies', strategyRoutes);
app.use('/api/admin/batches', batchRoutes);
app.use('/api/scan', scanRoutes);
app.use(errorHandler);

module.exports = app;
