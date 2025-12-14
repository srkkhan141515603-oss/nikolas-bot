#!/bin/bash

# ========================================
# Nikolas Bot - Linux/macOS Startup Script
# ========================================

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   🤖 NIKOLAS BINARY BOT - LINUX/macOS  ║"
echo "║   Auto Trading with 7 Laws Analysis    ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ ERROR: Node.js is not installed!"
    echo ""
    echo "Please install Node.js from:"
    echo "https://nodejs.org/ (LTS version recommended)"
    echo ""
    echo "Or use your package manager:"
    echo "  Ubuntu/Debian: sudo apt-get install nodejs npm"
    echo "  Fedora: sudo dnf install nodejs npm"
    echo "  macOS: brew install node"
    echo ""
    exit 1
fi

echo "✅ Node.js detected:"
node --version

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ ERROR: npm is not installed!"
    exit 1
fi

echo "✅ npm detected:"
npm --version
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]
then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]
    then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
    echo ""
fi

# Start the bot in development mode
echo "🚀 Starting Nikolas Bot..."
echo ""
echo "Server will run at: http://localhost:5173/"
echo ""
echo "Press CTRL+C to stop the bot"
echo ""

npm run dev
