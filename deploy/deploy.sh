#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/redbag}"
REPO_URL="${REPO_URL:-https://github.com/sunzy14-tech/redbag.git}"

if [ ! -d "$APP_DIR/.git" ]; then
  mkdir -p "$APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git fetch origin main
git checkout main
git pull --ff-only origin main

if [ ! -f deploy/server.env ]; then
  cp deploy/server.env.example deploy/server.env
  echo "Created deploy/server.env. Fill it before starting production services."
  exit 1
fi

mkdir -p deploy/certs deploy/ssl
docker compose --env-file deploy/server.env -f deploy/docker-compose.prod.yml up -d --build
docker compose --env-file deploy/server.env -f deploy/docker-compose.prod.yml ps

