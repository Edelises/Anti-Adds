#!/bin/bash
# ─── Anti-Adds: Stop All Services ─────────────────────────────────────────────
# Usage: bash STOP_SYSTEM.command (or double-click in Finder)

echo "🛑 Stopping Anti-Adds..."

# Kill backend
lsof -ti :8000 | xargs kill -9 2>/dev/null && echo "   Backend stopped" || echo "   Backend was not running"

# Kill frontend
lsof -ti :3000 | xargs kill -9 2>/dev/null && echo "   Frontend stopped" || echo "   Frontend was not running"

echo "✅ All services stopped."
