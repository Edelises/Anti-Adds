#!/bin/bash
# ─── Anti-Adds: Start All Services + Desktop UI ───────────────────────────────

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Load Node path
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"

echo "🛑 Cleaning up existing processes..."
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :8000 | xargs kill -9 2>/dev/null
sleep 1

echo "🚀 Starting Backend (port 8000)..."
nohup python3 "Python Files/main.py" > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

echo "🚀 Launching Desktop App (Tauri)..."
cd web
# npm run tauri dev
npx tauri dev
