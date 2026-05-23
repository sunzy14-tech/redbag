# 商户品牌红包 Demo

完整可部署的“扫码瓶盖码领微信红包”工程，包含：

- `miniprogram/`：微信小程序前端，只保留扫码中奖和红包领取流程。
- `backend/`：Node.js + Express + MySQL 后端，包含后台登录、产品/红包策略、唯一二维码批量生成、PDF/ZIP 导出、扫码开奖、红包发放接口。
- `deploy/`：本地/服务器 Docker Compose 部署示例。

## 快速启动后端

```bash
cd backend
cp .env.example .env
npm install
npm run db:init
npm start
```

或使用 Docker：

```bash
cd deploy
docker compose up -d
```

默认后台账号来自 `.env`：

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ChangeMe123!
```

## 小程序联调

1. 用微信开发者工具打开 `miniprogram/`。
2. 修改 `miniprogram/utils/config.js` 中的 `API_BASE_URL`。
3. 先通过后端生成二维码批次，再用小程序扫码领取。

## 微信品牌红包

后端红包发放调用微信支付品牌红包接口：

```text
POST /v3/fund-app/brand-redpacket/brand-merchant-batches
```

`.env` 中配置商户号、品牌 ID、品牌 AppID、模板 ID、商户 API 私钥、商户证书序列号、微信支付平台证书序列号或微信支付公钥 ID。默认 `WECHAT_PAY_ENABLED=false` 时为模拟发放，便于先完成测试部署；正式发放前需要在微信支付商户平台开通品牌红包能力并配置模板。

## 服务器部署

生产部署文件在 `deploy/`：

- `docker-compose.prod.yml`：MySQL、后端、Nginx 三容器部署。
- `server.env.example`：服务器环境变量模板。
- `nginx.conf`：HTTPS 反向代理配置。
- `deploy.sh`：服务器拉取 GitHub 代码并启动服务的脚本。

详细步骤见 `docs/server-deploy.md`。
