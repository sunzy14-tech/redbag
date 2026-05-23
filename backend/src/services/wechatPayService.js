const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const env = require('../config/env');
const { AppError } = require('../utils/errors');

const BRAND_REDPACKET_PATH = '/v3/fund-app/brand-redpacket/brand-merchant-batches';

function assertWechatConfigured() {
  const required = [
    'mchId',
    'merchantSerialNo',
    'wechatpaySerialNo',
    'privateKeyPath',
    'brandId',
    'brandAppId',
    'brandTemplateId'
  ];
  const missing = required.filter((key) => !env.wechat[key]);
  if (missing.length) {
    throw new AppError(`微信品牌红包配置缺失: ${missing.join(', ')}`, 500, 'WECHAT_BRAND_REDPACKET_CONFIG_MISSING');
  }
  if (!fs.existsSync(env.wechat.privateKeyPath)) {
    throw new AppError('微信支付商户 API 私钥文件不存在', 500, 'WECHAT_PAY_PRIVATE_KEY_MISSING');
  }
}

function buildAuthorization(method, urlPath, body) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`;
  const privateKey = fs.readFileSync(env.wechat.privateKeyPath, 'utf8');
  const signature = crypto.createSign('RSA-SHA256').update(message).sign(privateKey, 'base64');
  return [
    'WECHATPAY2-SHA256-RSA2048',
    `mchid="${env.wechat.mchId}"`,
    `nonce_str="${nonce}"`,
    `signature="${signature}"`,
    `timestamp="${timestamp}"`,
    `serial_no="${env.wechat.merchantSerialNo}"`
  ].join(' ');
}

function postWechatJson(urlPath, payload) {
  const body = JSON.stringify(payload);
  const options = {
    hostname: 'api.mch.weixin.qq.com',
    port: 443,
    path: urlPath,
    method: 'POST',
    headers: {
      Authorization: buildAuthorization('POST', urlPath, body),
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Wechatpay-Serial': env.wechat.wechatpaySerialNo,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch (_error) {
          data = { raw };
        }
        if (res.statusCode >= 200 && res.statusCode < 300) return resolve(data);
        reject(new AppError(data.message || '微信品牌红包请求失败', res.statusCode || 502, data.code || 'WECHAT_BRAND_REDPACKET_ERROR'));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function alnum32(value) {
  const cleaned = String(value).replace(/[^a-zA-Z0-9]/g, '');
  if (cleaned.length >= 8) return cleaned.slice(0, 32);
  return `${cleaned}${Date.now()}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
}

function trim32(value) {
  return String(value || '').slice(0, 32);
}

async function sendRedbag({ openid, amountCents, outTradeNo }) {
  if (!openid) throw new AppError('缺少用户 openid', 400, 'OPENID_REQUIRED');
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new AppError('红包金额必须大于 0 分', 400, 'INVALID_REDPACKET_AMOUNT');
  }

  const batchNo = alnum32(outTradeNo);
  const detailNo = alnum32(`${outTradeNo}D`);

  if (!env.wechat.enabled) {
    return {
      provider: 'mock-brand-redpacket',
      status: 'ACCEPTED',
      paymentNo: `MOCK-${batchNo}`,
      response: {
        out_batch_no: batchNo,
        batch_no: `MOCK-${batchNo}`,
        batch_state: 'ACCEPTED'
      },
      message: 'WECHAT_PAY_ENABLED=false，已完成品牌红包模拟发放'
    };
  }

  assertWechatConfigured();
  const payload = {
    brand_id: Number(env.wechat.brandId),
    brand_appid: env.wechat.brandAppId,
    scene: env.wechat.brandScene || 'CUSTOM_SEND',
    template_id: env.wechat.brandTemplateId,
    out_batch_no: batchNo,
    batch_name: trim32(env.wechat.brandBatchName || '扫码品牌红包'),
    batch_remark: trim32(env.wechat.brandBatchRemark || '扫码品牌红包'),
    total_amount: amountCents,
    total_num: 1,
    detail_list: [{
      out_detail_no: detailNo,
      amount: amountCents,
      openid,
      remark: trim32(env.wechat.brandDetailRemark || '来自品牌的红包')
    }]
  };

  const response = await postWechatJson(BRAND_REDPACKET_PATH, payload);
  return {
    provider: 'wechat-brand-redpacket',
    status: response.batch_state || 'ACCEPTED',
    paymentNo: response.batch_no,
    response
  };
}

module.exports = { sendRedbag };
