const path = require('path');
const express = require('express');
const { Joi, validate } = require('../validators/common');
const { query, transaction } = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');
const { AppError, asyncHandler } = require('../utils/errors');
const { createCodePayload, renderQrImage, exportZip, exportPdf } = require('../services/qrService');

const router = express.Router();
router.use(requireAdmin);

router.get('/', asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT b.*, p.name product_name, s.name strategy_name
     FROM qr_batches b
     JOIN products p ON p.id=b.product_id
     JOIN redbag_strategies s ON s.id=b.strategy_id
     ORDER BY b.id DESC`
  );
  res.json({ success: true, data: rows });
}));

router.post('/generate', validate(Joi.object({
  batchNo: Joi.string().max(80).required(),
  productId: Joi.number().integer().positive().required(),
  strategyId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).max(10000).required(),
  factoryName: Joi.string().allow('').max(120).default(''),
  remark: Joi.string().allow('').max(500).default('')
})), asyncHandler(async (req, res) => {
  const body = req.body;
  const existing = await query('SELECT id FROM qr_batches WHERE batch_no=:batchNo LIMIT 1', { batchNo: body.batchNo });
  if (existing.length) throw new AppError('批次号已存在', 409, 'BATCH_EXISTS');

  const batchId = await transaction(async (conn) => {
    const [batchResult] = await conn.execute(
      `INSERT INTO qr_batches (batch_no, product_id, strategy_id, quantity, factory_name, remark)
       VALUES (:batchNo, :productId, :strategyId, :quantity, :factoryName, :remark)`,
      body
    );
    return batchResult.insertId;
  });

  const created = [];
  for (let i = 1; i <= body.quantity; i += 1) {
    const serialNo = `${body.batchNo}-${String(i).padStart(6, '0')}`;
    const payload = await createCodePayload({ productId: body.productId, batchId, serialNo });
    const imagePath = await renderQrImage(payload.token, serialNo);
    await query(
      `INSERT INTO qr_codes (batch_id, serial_no, token_hash, encrypted_payload, image_path, status)
       VALUES (:batchId, :serialNo, :tokenHash, :encryptedPayload, :imagePath, 'unused')`,
      {
        batchId,
        serialNo,
        tokenHash: payload.tokenHash,
        encryptedPayload: payload.token,
        imagePath
      }
    );
    created.push({ serialNo, imagePath });
  }

  res.json({ success: true, data: { batchId, quantity: created.length } });
}));

router.post('/:id/export', validate(Joi.object({
  format: Joi.string().valid('zip', 'pdf').required()
})), asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM qr_codes WHERE batch_id=:batchId ORDER BY id ASC', { batchId: req.params.id });
  if (!rows.length) throw new AppError('批次不存在或没有二维码', 404, 'BATCH_NOT_FOUND');
  const batchRows = await query('SELECT batch_no FROM qr_batches WHERE id=:batchId LIMIT 1', { batchId: req.params.id });
  const file = req.body.format === 'pdf'
    ? await exportPdf(batchRows[0].batch_no, rows)
    : await exportZip(batchRows[0].batch_no, rows);
  res.json({ success: true, data: { fileName: path.basename(file), downloadUrl: `/api/admin/batches/download/${path.basename(file)}` } });
}));

router.get('/download/:fileName', asyncHandler(async (req, res) => {
  const safeName = path.basename(req.params.fileName);
  res.download(path.resolve(process.cwd(), 'storage/exports', safeName));
}));

module.exports = router;

