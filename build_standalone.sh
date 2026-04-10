#!/bin/bash
# ─── Anti-Adds: Standalone Product Build ──────────────────────────────────────

# Load Environment
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
export PATH="/Users/edelisesquaresma/Library/Python/3.9/bin:$PATH"

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "🏗️  Building Production Standalone Executable..."
cd web

# Build Tauri App
npx tauri build

echo "✨ Extracting Native Executable to Main Folder..."
cd ..
cp -R "web/src-tauri/target/release/bundle/macos/Anti-Adds Detector.app" .

echo "✅ ALL DONE! You can now Double-Click 'Anti-Adds Detector.app' right here in the folder."
