#!/bin/bash
# ─── Anti-Ads: Master Build Script ───────────────────────────────────────────
# This script handles the entire pipeline:
# 1. Compiles the Python sidecar into a native binary
# 2. Bundles the binary and resources into the Tauri app
# 3. Ensures the app starts the backend automatically on double-click

# Exit on error
set -e

# Load Environment
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
export PATH="/Users/edelisesquaresma/Library/Python/3.9/bin:$PATH"

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "🧹 Cleaning up previous builds..."
rm -rf web/src-tauri/bin
rm -rf web/src-tauri/templates
mkdir -p web/src-tauri/bin
mkdir -p web/src-tauri/templates

echo "🎨 Syncing templates..."
cp -R templates/* web/src-tauri/templates/

echo "🏗️  Phase 1: Building Python Sidecar (Backend Engine)..."
cd "Python Files"
# We build as a single file (--onefile) for simplicity in Tauri
python3 -m PyInstaller --onefile --name backend-engine main.py

echo "📦 Phase 2: Preparing Sidecar for Tauri..."
# Tauri requires sidecars to have the target triple suffix
TRIPLE="aarch64-apple-darwin"
cp "dist/backend-engine" "../web/src-tauri/bin/backend-engine-$TRIPLE"
cd ..

echo "🚀 Phase 3: Building Production Desktop App (Tauri)..."
cd web
npm run tauri build

echo "✨ Phase 4: Finalizing Desktop Bundle..."
cd ..
rm -rf "Anti-Ads Detector.app"
cp -R "web/src-tauri/target/release/bundle/macos/Anti-Ads Detector.app" .

echo "✅ ALL DONE! The backend is now fully bundled inside the app."
echo "👉 You can now Double-Click 'Anti-Ads Detector.app' and it will work perfectly."
