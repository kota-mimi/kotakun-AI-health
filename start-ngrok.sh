#!/bin/bash

echo "🌐 Starting ngrok tunnel..."

# 既存のngrokプロセスを終了
echo "🔄 Stopping existing ngrok processes..."
pkill -f ngrok 2>/dev/null || true

# 少し待つ
sleep 2

echo "🚀 Starting ngrok on port 3000..."
ngrok http 3000