#!/bin/bash

set -e

echo "🚀 Starting deployment"

BASE_DIR="/var/www/html/model01.optimasit.com/"

DEPLOY_DIR="$BASE_DIR/htdocs"
PROJECT_DIR="$DEPLOY_DIR/roumpos"

echo "📁 Base directory: $BASE_DIR"

cd $PROJECT_DIR

echo "🔄 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci

echo "🏗 Building project..."
npm run build

echo "📂 Syncing build files..."
rsync -av --delete dist/ $DEPLOY_DIR/ --exclude 'roumpos'

# Restart the server if it is already running
if pm2 list | grep -q "roumpos"; then
  pm2 restart roumpos
else
  pm2 start npm --name roumpos -- start
fi

echo "✅ Deployment finished"
