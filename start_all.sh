#!/bin/bash
# ─── Anti-Adds: Start All Services ────────────────────────────────────────────
# Usage: bash start_all.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "🛑 Cleaning up existing processes..."
lsof -ti :3000 | xargs kill -9 2>/dev/null
lsof -ti :8000 | xargs kill -9 2>/dev/null
sleep 1

echo "🚀 Starting Backend (port 8000)..."
nohup python3 "Python Files/main.py" > backend.log 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"

echo "🚀 Starting Frontend (port 3000)..."
cd web && nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"

sleep 3
echo ""
echo "✅ Anti-Adds running!"
echo "   Dashboard: http://localhost:3000"
echo "   API:       http://localhost:8000"
echo ""
echo "To stop: bash STOP_SYSTEM.command"
