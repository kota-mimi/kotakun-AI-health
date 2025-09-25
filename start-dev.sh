#!/bin/bash

echo "🚀 Starting development environment..."

# ポート3000を使用中のプロセスを終了
echo "🔄 Checking port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 少し待つ
sleep 2

echo "✅ Port 3000 is now available"

# Next.jsを3000ポートで起動
echo "🌟 Starting Next.js on port 3000..."
PORT=3000 npm run dev