@echo off
REM ========================================
REM Nikolas Bot - Windows Startup Script
REM ========================================

echo.
echo ╔════════════════════════════════════════╗
echo ║   🤖 NIKOLAS BINARY BOT - WINDOWS      ║
echo ║   Auto Trading with 7 Laws Analysis    ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/ (LTS version recommended)
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detected: %node_version%
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: npm is not installed!
    pause
    exit /b 1
)

echo ✅ npm detected
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
    echo.
)

REM Start the bot in development mode
echo 🚀 Starting Nikolas Bot...
echo.
echo Server will run at: http://localhost:5173/
echo.
echo Press CTRL+C to stop the bot
echo.

call npm run dev

pause
