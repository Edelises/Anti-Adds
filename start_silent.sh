#!/bin/bash
# Start Anti-Adds in background without leaving terminal open

cd "$(dirname "$0")"

# Source environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Kill old
lsof -ti :3000,8000 | xargs kill -9 2>/dev/null || true

# Launch Backend
nohup python3 "Python Files/main.py" > backend.log 2>&1 &

# Launch Frontend (next dev)
cd web
nohup npm run dev > ../frontend.log 2>&1 &

echo "✅ Anti-Adds is now running in the background."
echo "🌍 Visit http://localhost:3000 to control it."
sleep 2
# The terminal will now close itself if run as a .command
