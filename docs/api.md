# Redbag API

## Admin

- `POST /api/auth/login`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `GET /api/admin/strategies`
- `POST /api/admin/strategies`
- `GET /api/admin/batches`
- `POST /api/admin/batches/generate`
- `POST /api/admin/batches/:id/export`

Admin routes require `Authorization: Bearer <token>`.

## Mini Program

- `POST /api/scan/redeem`
- `POST /api/scan/claim`

二维码内容是服务端生成的短链接，短链接携带 AES-256-GCM 加密 token，服务端用 `token_hash` 和行级锁保证唯一领取。

红包发放调用微信支付品牌红包接口：

```text
POST https://api.mch.weixin.qq.com/v3/fund-app/brand-redpacket/brand-merchant-batches
```

当前实现按扫码单笔发放，每次创建 1 笔品牌红包批次；官方限制同一批次最多 10 笔，后续如需合并批量发放可以复用同一服务模块扩展。

## Example

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ChangeMe123!"}'
```

```bash
TOKEN=上一步返回的token

curl -X POST http://localhost:3000/api/admin/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"品牌瓶盖产品","sku":"SKU-001","description":"扫码领红包产品"}'

curl -X POST http://localhost:3000/api/admin/strategies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"99.9%随机红包","type":"random","winRate":99.9,"minAmount":0.3,"maxAmount":8.8}'

curl -X POST http://localhost:3000/api/admin/batches/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"batchNo":"BATCH-20260522","productId":1,"strategyId":1,"quantity":100,"factoryName":"印刷厂"}'

curl -X POST http://localhost:3000/api/admin/batches/1/export \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format":"pdf"}'
```
