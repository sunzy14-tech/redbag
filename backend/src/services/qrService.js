const path = require('path');
const fs = require('fs/promises');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const { encryptPayload, sha256 } = require('../utils/crypto');

const qrDir = path.resolve(process.cwd(), 'storage/qrcodes');
const exportDir = path.resolve(process.cwd(), 'storage/exports');

function buildQrUrl(token) {
  return `${env.publicBaseUrl.replace(/\/$/, '')}/api/scan/entry?code=${encodeURIComponent(token)}`;
}

async function renderQrImage(token, serialNo) {
  await fs.mkdir(qrDir, { recursive: true });
  const file = path.join(qrDir, `${serialNo}.png`);
  await QRCode.toFile(file, buildQrUrl(token), {
    type: 'png',
    width: 900,
    margin: 2,
    errorCorrectionLevel: 'H'
  });
  return file;
}

async function createCodePayload({ productId, batchId, serialNo }) {
  const nonce = uuidv4();
  const token = encryptPayload({
    v: 1,
    productId,
    batchId,
    serialNo,
    nonce,
    iat: Date.now()
  });
  return { token, tokenHash: sha256(token), nonce };
}

async function exportZip(batchNo, codeRows) {
  await fs.mkdir(exportDir, { recursive: true });
  const zip = new AdmZip();
  for (const row of codeRows) zip.addLocalFile(row.image_path);
  const file = path.join(exportDir, `${batchNo}-qrcodes.zip`);
  zip.writeZip(file);
  return file;
}

async function exportPdf(batchNo, codeRows) {
  await fs.mkdir(exportDir, { recursive: true });
  const file = path.join(exportDir, `${batchNo}-qrcodes.pdf`);
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const stream = require('fs').createWriteStream(file);
  doc.pipe(stream);
  doc.fontSize(18).text(`QR Batch: ${batchNo}`, { align: 'center' });
  doc.moveDown();
  let x = 42;
  let y = 90;
  for (const row of codeRows) {
    doc.image(row.image_path, x, y, { width: 120, height: 120 });
    doc.fontSize(8).text(row.serial_no, x, y + 124, { width: 120, align: 'center' });
    x += 170;
    if (x > 420) {
      x = 42;
      y += 165;
    }
    if (y > 680) {
      doc.addPage();
      x = 42;
      y = 60;
    }
  }
  doc.end();
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
  return file;
}

module.exports = { createCodePayload, renderQrImage, exportZip, exportPdf, buildQrUrl };

