const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { AppError } = require('../utils/errors');

function requireAdmin(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next(new AppError('未登录', 401, 'UNAUTHORIZED'));
  try {
    req.admin = jwt.verify(token, env.jwtSecret);
    next();
  } catch (_error) {
    next(new AppError('登录已过期', 401, 'TOKEN_EXPIRED'));
  }
}

module.exports = { requireAdmin };

