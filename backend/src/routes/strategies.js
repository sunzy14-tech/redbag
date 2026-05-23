const express = require('express');
const { Joi, validate } = require('../validators/common');
const { query } = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/errors');
const { cents } = require('../services/redbagService');

const router = express.Router();
router.use(requireAdmin);

router.get('/', asyncHandler(async (_req, res) => {
  const rows = await query('SELECT * FROM redbag_strategies ORDER BY id DESC');
  res.json({ success: true, data: rows });
}));

router.post('/', validate(Joi.object({
  name: Joi.string().max(100).required(),
  type: Joi.string().valid('fixed', 'random', 'probability').required(),
  winRate: Joi.number().min(0).max(100).default(100),
  fixedAmount: Joi.number().min(0.01).max(200).optional(),
  minAmount: Joi.number().min(0.01).max(200).optional(),
  maxAmount: Joi.number().min(0.01).max(200).optional(),
  probabilityRules: Joi.array().items(Joi.object({
    amount: Joi.number().min(0.01).max(200).required(),
    rate: Joi.number().min(0).max(100).required()
  })).default([]),
  status: Joi.string().valid('enabled', 'disabled').default('enabled')
})), asyncHandler(async (req, res) => {
  const body = req.body;
  const result = await query(
    `INSERT INTO redbag_strategies
      (name, type, win_rate, fixed_amount_cents, min_amount_cents, max_amount_cents, probability_rules, status)
     VALUES
      (:name, :type, :winRate, :fixedAmountCents, :minAmountCents, :maxAmountCents, :probabilityRules, :status)`,
    {
      name: body.name,
      type: body.type,
      winRate: body.winRate,
      fixedAmountCents: body.fixedAmount ? cents(body.fixedAmount) : null,
      minAmountCents: body.minAmount ? cents(body.minAmount) : null,
      maxAmountCents: body.maxAmount ? cents(body.maxAmount) : null,
      probabilityRules: JSON.stringify(body.probabilityRules),
      status: body.status
    }
  );
  res.json({ success: true, data: { id: result.insertId } });
}));

module.exports = router;

