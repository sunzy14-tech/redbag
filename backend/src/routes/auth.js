const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Joi, validate } = require('../validators/common');
const { query } = require('../db/pool');
const env = require('../config/env');
const { AppError, asyncHandler } = require('../utils/errors');

const router = express.Router();

router.post('/login', validate(Joi.object({
  username: Joi.string().min(2).max(64).required(),
  password: Joi.string().min(6).max(128).required()
})), asyncHandler(async (req, res) => {
  const rows = await query('SELECT id, username, password_hash, role FROM admins WHERE username=:username LIMIT 1', {
    username: req.body.username
  });
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(req.body.password, admin.password_hash))) {
    throw new AppError('账号或密码错误', 401, 'INVALID_CREDENTIALS');
  }
  const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, env.jwtSecret, { expiresIn: '8h' });
  res.json({ success: true, data: { token, admin: { id: admin.id, username: admin.username, role: admin.role } } });
}));

module.exports = router;

