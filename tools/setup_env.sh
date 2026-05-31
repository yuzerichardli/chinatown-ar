#!/bin/bash
# Rebuild the AR Chinatown local toolchain on a new macOS machine (needs Homebrew).
# Run from the project root:  bash tools/setup_env.sh
set -e

echo "==> GitHub CLI"
command -v gh >/dev/null || brew install gh
gh auth status >/dev/null 2>&1 || gh auth login --hostname github.com --git-protocol https --web

echo "==> git large-push buffer (avoids HTTP 408 on ~40MB model pushes)"
git config http.postBuffer 524288000

echo "==> Python venv with conversion libs (./.venv)"
python3 -m venv .venv
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install trimesh pygltflib pillow numpy fast-simplification

echo "==> Blender (for decimating heavy models)"
ls /Applications/Blender.app >/dev/null 2>&1 || brew install --cask blender

echo "Done."
echo "  venv:    ./.venv/bin/python"
echo "  blender: /Applications/Blender.app/Contents/MacOS/Blender"
echo "  (sips for image resizing is built into macOS)"
