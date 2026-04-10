#!/bin/bash
# ─── Tauri Setup Script ───────────────────────────────────────────────────────

# Add node/npm to path
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"

echo "🚀 Initializing Tauri for 'Anti-Adds Detector'..."
cd web

# Initialize Tauri
# --frontend-dist: The directory where Next.js exports static files
# --dev-url: The local Next.js dev server
npx -y @tauri-apps/cli init \
  --ci \
  --app-name "anti-adds-detector" \
  --window-title "Anti-Adds Detector" \
  --frontend-dist "../out" \
  --dev-url "http://localhost:3000" \
  --before-dev-command "npm run dev" \
  --before-build-command "npm run build"
