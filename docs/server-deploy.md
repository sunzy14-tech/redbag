# Server Deployment

## 1. Prepare Server

Recommended server:

- Ubuntu 22.04 or 24.04
- 2 CPU / 4 GB RAM minimum
- Ports 80 and 443 open
- Docker Engine and Docker Compose plugin installed
- A domain such as `api.your-domain.com` pointing to the server IP

Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Log out and log back in after adding the Docker group.

## 2. Clone And Configure

```bash
sudo mkdir -p /opt/redbag
sudo chown -R $USER:$USER /opt/redbag
git clone https://github.com/sunzy14-tech/redbag.git /opt/redbag
cd /opt/redbag
cp deploy/server.env.example deploy/server.env
```

Edit `deploy/server.env` and fill all production values.

Important values:

- `PUBLIC_BASE_URL`: must be the HTTPS API domain used by the mini program.
- `JWT_SECRET`, `QR_AES_KEY`, `QR_HMAC_SECRET`: use long random secrets.
- `WECHAT_PAY_ENABLED`: keep `false` for test mode, change to `true` only after certificates and brand redpacket settings are ready.
- `WECHAT_PAY_PRIVATE_KEY_PATH`: keep `/app/certs/apiclient_key.pem` inside Docker.
- `WECHAT_BRAND_TEMPLATE_ID`: use the template ID from WeChat Pay brand redpacket settings.

## 3. Certificates

Put WeChat Pay merchant API certificates here:

```bash
/opt/redbag/deploy/certs/apiclient_key.pem
/opt/redbag/deploy/certs/apiclient_cert.pem
```

Put HTTPS certificates here:

```bash
/opt/redbag/deploy/ssl/fullchain.pem
/opt/redbag/deploy/ssl/privkey.pem
```

Update `deploy/nginx.conf` and replace `api.your-domain.com` with the real API domain.

## 4. Start Services

```bash
cd /opt/redbag
docker compose --env-file deploy/server.env -f deploy/docker-compose.prod.yml up -d --build
docker compose --env-file deploy/server.env -f deploy/docker-compose.prod.yml ps
```

Health check:

```bash
curl https://api.your-domain.com/health
```

Expected response:

```json
{"success":true,"data":{"status":"ok"}}
```

## 5. Mini Program

Update `miniprogram/utils/config.js`:

```js
module.exports = {
  API_BASE_URL: 'https://api.your-domain.com'
};
```

In WeChat Mini Program Admin, add the same HTTPS domain to request legal domains.

## 6. Upgrade

```bash
cd /opt/redbag
git pull --ff-only origin main
docker compose --env-file deploy/server.env -f deploy/docker-compose.prod.yml up -d --build
```

