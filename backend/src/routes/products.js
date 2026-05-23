const express = require('express');
const { Joi, validate } = require('../validators/common');
const { query } = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errors');

const router = express.Router();
router.use(requireAdmin);

router.get('/', asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM products ORDER BY id DESC');
  res.json({ success: true, data: rows });
}));

router.post('/', validate(Joi.object({
  name: Joi.string().max(120).required(),
  sku: Joi.string().max(80).required(),
  description: Joi.string().allow('').max(500).default('')
})), asyncHandler(async (req, res) => {
  const result = await query(
    'INSERT INTO products (name, sku, description) VALUES (:name, :sku, :description)',
    req.body
  );
  res.json({ success: true, data: { id: result.insertId } });
}));

module.exports = router;

