const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

function required(name, fallback) {
  const value = process.env[name] !== undefined ? process.env[name] : fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  publicBaseUrl: required('PUBLIC_BASE_URL', `http://localhost:${process.env.PORT || 3000}`),
  jwtSecret: required('JWT_SECRET', 'dev_jwt_secret_change_me'),
  qrAesKey: required('QR_AES_KEY', 'dev_qr_aes_key_change_me_32bytes'),
  qrHmacSecret: required('QR_HMAC_SECRET', 'dev_qr_hmac_secret_change_me'),
  adminUsername: required('ADMIN_USERNAME', 'admin'),
  adminPassword: required('ADMIN_PASSWORD', 'ChangeMe123!'),
  db: {
    host: required('DB_HOST', '127.0.0.1'),
    port: Number(process.env.DB_PORT || 3306),
    user: required('DB_USER', 'root'),
    password: required('DB_PASSWORD', ''),
    database: required('DB_NAME', 'redbag'),
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
  },
  wechat: {
    appId: process.env.WECHAT_APPID || '',
    mchId: process.env.WECHAT_MCH_ID || '',
    merchantSerialNo: process.env.WECHAT_MERCHANT_SERIAL_NO || process.env.WECHAT_PAY_SERIAL_NO || '',
    wechatpaySerialNo: process.env.WECHATPAY_SERIAL_NO || process.env.WECHAT_PAY_SERIAL_NO || '',
    apiV3Key: process.env.WECHAT_PAY_API_V3_KEY || '',
    privateKeyPath: process.env.WECHAT_PAY_PRIVATE_KEY_PATH || '',
    certPath: process.env.WECHAT_PAY_CERT_PATH || '',
    transferSceneId: process.env.WECHAT_PAY_TRANSFER_SCENE_ID || '',
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || '',
    brandId: process.env.WECHAT_BRAND_ID || '',
    brandAppId: process.env.WECHAT_BRAND_APPID || process.env.WECHAT_APPID || '',
    brandScene: process.env.WECHAT_BRAND_SCENE || 'CUSTOM_SEND',
    brandTemplateId: process.env.WECHAT_BRAND_TEMPLATE_ID || '',
    brandBatchName: process.env.WECHAT_BRAND_BATCH_NAME || '扫码品牌红包',
    brandBatchRemark: process.env.WECHAT_BRAND_BATCH_REMARK || '扫码品牌红包',
    brandDetailRemark: process.env.WECHAT_BRAND_DETAIL_REMARK || '来自品牌的红包',
    enabled: process.env.WECHAT_PAY_ENABLED === 'true'
  }
};
