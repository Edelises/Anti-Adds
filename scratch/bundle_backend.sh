#!/bin/bash
# ─── Anti-Adds: Bundle Backend & Configure Tauri Sidecar ──────────────────────

# Add Python/Node paths
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"
export PATH="/Users/edelisesquaresma/Library/Python/3.9/bin:$PATH"

# Run from project root
cd "/Users/edelisesquaresma/Edelises Quaresma/Projects/Antigravity/Anti-Adds"

echo "📦 Bundling Python Backend into a standalone binary..."
mkdir -p web/src-tauri/binaries

# Bundle main.py using PyInstaller
pyinstaller --onefile --noconsole --clean \
    --hidden-import "Quartz" \
    --hidden-import "AppKit" \
    --hidden-import "appdirs" \
    --hidden-import "fastapi" \
    --hidden-import "uvicorn" \
    --exclude-module "pkg_resources" \
    --name "backend-engine" \
    "Python Files/main.py"

# Tauri sidecar naming convention: name-target-triple
TRIPLE=$(rustc -Vv | grep host: | cut -d' ' -f2)
mv "dist/backend-engine" "web/src-tauri/backend-engine-$TRIPLE"

echo "✅ Backend binary created: web/src-tauri/backend-engine-$TRIPLE"
rm -rf build dist backend-engine.spec
