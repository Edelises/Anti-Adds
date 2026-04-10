#!/bin/bash
# ─── Tauri Icon Generator Script (V2 - Based on user reference) ────────────

# Path to the high-res generated icon (3D version of icon_3.png)
SOURCE_IMG="/Users/edelisesquaresma/.gemini/antigravity/brain/76a78249-fe0c-41d5-96fc-5652c43d2c28/aad_icon_3d_v2_1775822396923.png"
PNG_ICON="/Users/edelisesquaresma/Edelises Quaresma/Projects/Antigravity/Anti-Adds/web/src-tauri/aad_icon_source.png"

# Add node/npm to path
export PATH="$HOME/.nvm/versions/node/v24.11.1/bin:$PATH"

echo "🎨 Converting V2 3D Icon to PNG..."
sips -s format png "$SOURCE_IMG" --out "$PNG_ICON"

echo "🎨 Applying V2 3D Icon to Tauri project..."
cd web

# Run the tauri icon command
npx -y @tauri-apps/cli icon "$PNG_ICON"

echo "✅ Final Icons generated for Windows and macOS!"
