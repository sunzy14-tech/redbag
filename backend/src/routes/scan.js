const express = require('express');
const { Joi, validate } = require('../validators/common');
const { query, transaction } = require('../db/pool');
const { AppError, asyncHandler } = require('../utils/errors');
const { decryptPayload, sha256 } = require('../utils/crypto');
const { pickPrize, yuan } = require('../services/redbagService');
const { sendRedbag } = require('../services/wechatPayService');

const router = express.Router();

router.get('/entry', (req, res) => {
  res.json({ success: true, data: { code: req.query.code || '' } });
});

router.post('/redeem', validate(Joi.object({
  code: Joi.string().min(20).required(),
  openid: Joi.string().max(80).allow('').default(''),
  nickname: Joi.string().max(80).allow('').default('')
})), asyncHandler(async (req, res) => {
  const payload = decryptPayload(req.body.code);
  if (!payload || !payload.serialNo) throw new AppError('二维码无效', 400, 'INVALID_QR');

  const result = await transaction(async (conn) => {
    const [codes] = await conn.execute(
      `SELECT c.*, b.product_id, b.strategy_id, p.name product_name
       FROM qr_codes c
       JOIN qr_batches b ON b.id=c.batch_id
       JOIN products p ON p.id=b.product_id
       WHERE c.serial_no=:serialNo AND c.token_hash=:tokenHash
       LIMIT 1 FOR UPDATE`,
      { serialNo: payload.serialNo, tokenHash: sha256(req.body.code) }
    );
    const code = codes[0];
    if (!code) throw new AppError('二维码不存在', 404, 'QR_NOT_FOUND');
    if (code.status !== 'unused') throw new AppError('该瓶盖码已领取', 409, 'QR_USED');

    const [strategies] = await conn.execute('SELECT * FROM redbag_strategies WHERE id=:id LIMIT 1', { id: code.strategy_id });
    const prize = pickPrize(strategies[0]);
    const amount = yuan(prize.amountCents);
    const outTradeNo = `RB${Date.now()}${code.id}`;

    await conn.execute(
      `INSERT INTO redbag_records
        (qr_code_id, product_id, strategy_id, openid, nickname, out_trade_no, amount_cents, status)
       VALUES
        (:qrCodeId, :productId, :strategyId, :openid, :nickname, :outTradeNo, :amountCents, 'pending')`,
      {
        qrCodeId: code.id,
        productId: code.product_id,
        strategyId: code.strategy_id,
        openid: req.body.openid || null,
        nickname: req.body.nickname || null,
        outTradeNo,
        amountCents: prize.amountCents
      }
    );
    await conn.execute(
      `UPDATE qr_codes SET status='used', used_at=NOW(), openid=:openid WHERE id=:id`,
      { id: code.id, openid: req.body.openid || null }
    );
    return { amount, amountCents: prize.amountCents, productName: code.product_name, outTradeNo };
  });

  res.json({ success: true, data: { won: true, ...result } });
}));

router.post('/claim', validate(Joi.object({
  outTradeNo: Joi.string().max(64).required(),
  openid: Joi.string().max(80).required()
})), asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM redbag_records WHERE out_trade_no=:outTradeNo LIMIT 1', req.body);
  const record = rows[0];
  if (!record) throw new AppError('红包记录不存在', 404, 'REDBAG_NOT_FOUND');
  if (record.status === 'paid' || record.status === 'processing') {
    return res.json({ success: true, data: { status: record.status } });
  }
  const payment = await sendRedbag({
    openid: req.body.openid,
    amountCents: record.amount_cents,
    outTradeNo: record.out_trade_no
  });
  await query(
    `UPDATE redbag_records SET status='processing', provider_payment_no=:paymentNo, provider_response=:response WHERE id=:id`,
    { id: record.id, paymentNo: payment.paymentNo, response: JSON.stringify(payment) }
  );
  res.json({ success: true, data: { status: 'processing', payment } });
}));

module.exports = router;
