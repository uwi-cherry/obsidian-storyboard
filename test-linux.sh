#!/bin/bash

# Obsidian Linux Test Script for WSL2
# Usage: ./test-linux.sh [vault_path] [start]
#   ./test-linux.sh                    - Setup only (use default vault)
#   ./test-linux.sh start              - Setup and run Obsidian (use default vault)
#   ./test-linux.sh /path/to/vault     - Setup only (use specified vault)
#   ./test-linux.sh /path/to/vault start - Setup and run Obsidian (use specified vault)

set -e  # Exit on any error

OBSIDIAN_VERSION="1.8.10"
APPIMAGE_FILE="Obsidian-${OBSIDIAN_VERSION}.AppImage"
DOWNLOAD_URL="https://github.com/obsidianmd/obsidian-releases/releases/download/v${OBSIDIAN_VERSION}/${APPIMAGE_FILE}"

echo "🚀 Obsidian Plugin Test Setup for WSL2"
echo "======================================"
echo "Version: ${OBSIDIAN_VERSION}"
echo ""

# Check if we're in WSL2
if ! grep -q "microsoft" /proc/version; then
    echo "⚠️  Warning: This script is designed for WSL2 environment"
fi

# Update and install dependencies
echo "📦 Installing required dependencies..."
sudo apt-get update -qq
sudo apt-get install -y \
    wget \
    fuse \
    libfuse2 \
    libnss3 \
    libgtk-3-0 \
    libxss1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libcairo-gobject2 \
    libgdk-pixbuf2.0-0 2>/dev/null || echo "Some packages not found, continuing..."

echo "✅ Dependencies installed"

# Set up X11 display
echo "🖥️  Setting up X11 display..."
export DISPLAY=:0
export LIBGL_ALWAYS_INDIRECT=1
export NO_AT_BRIDGE=1
echo "Using DISPLAY: $DISPLAY"

# Download Obsidian AppImage
if [ ! -f "${APPIMAGE_FILE}" ]; then
    echo "⬇️  Downloading Obsidian ${OBSIDIAN_VERSION}..."
    wget -q --show-progress "${DOWNLOAD_URL}"
else
    echo "✅ Obsidian AppImage already exists"
fi

# Make executable
echo "🔧 Making AppImage executable..."
chmod +x "${APPIMAGE_FILE}"

# Always start Obsidian
START_OBSIDIAN=true

# Set up plugin in current location (we're already in the plugin directory)
PLUGIN_DIR="."
echo "📋 Using current plugin directory..."

# Check required files (we're already in the plugin directory)
if [ ! -f "main.js" ]; then
    echo "❌ Error: main.js not found. Run from plugin directory."
    exit 1
fi

if [ ! -f "manifest.json" ]; then
    echo "❌ Error: manifest.json not found. Run from plugin directory."
    exit 1
fi

echo "✅ Plugin files found in current directory"

# Plugin setup complete - no vault modification needed
echo "✅ Plugin ready for testing"

echo ""
echo "🎯 Setup Complete!"
echo ""
echo "📝 Test Checklist:"
echo "   □ Plugin loads without errors"
echo "   □ Paint tools work correctly"
echo "   □ ComfyUI connection works (if ComfyUI is running)"
echo "   □ PSD file save/load works"
echo "   □ Layer management works"
echo "   □ No console errors (F12 → Console)"
echo ""

# Start Obsidian
echo "🚀 Starting Obsidian..."
export APPIMAGE_EXTRACT_AND_RUN=1
"./${APPIMAGE_FILE}"