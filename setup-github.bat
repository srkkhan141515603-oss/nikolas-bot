@echo off
REM Quick GitHub Deployment Setup Script for Windows

echo.
echo ╔════════════════════════════════════════════╗
echo ║  🤖 Nikolas Bot - GitHub Deployment Setup  ║
echo ║  Username: srkkhan141515603-oss           ║
echo ╚════════════════════════════════════════════╝
echo.

REM Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git is not installed!
    echo Install from: https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Git detected
git --version
echo.

REM Initialize git if needed
if not exist ".git" (
    echo 📝 Initializing git repository...
    git init
    git config user.name "srkkhan141515603-oss"
    git config user.email "your_email@github.com"
    echo ✅ Git initialized
    echo.
)

REM Add files
echo 📦 Adding all files...
git add .

REM Create initial commit
echo 💾 Creating initial commit...
git commit -m "🚀 Initial Nikolas Bot commit with 24/7 deployment setup"

REM Show git status
echo.
echo 📊 Current git status:
git status

REM Instructions
echo.
echo ╔════════════════════════════════════════════╗
echo ║  ✅ NEXT STEPS                             ║
echo ╚════════════════════════════════════════════╝
echo.
echo 1️⃣ Create repository on GitHub:
echo    https://github.com/new
echo    Repository name: nikolas-bot
echo.
echo 2️⃣ Add remote (copy-paste one of these):
echo.
echo    HTTPS:
echo    git remote add origin https://github.com/srkkhan141515603-oss/nikolas-bot.git
echo.
echo    SSH (if set up):
echo    git remote add origin git@github.com:srkkhan141515603-oss/nikolas-bot.git
echo.
echo    Then:
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3️⃣ Deploy to Railway (RECOMMENDED):
echo.
echo    npm install -g @railway/cli
echo    railway login
echo    railway init
echo    railway up
echo.
echo 4️⃣ Or Deploy to Render:
echo.
echo    - Go to: https://render.com
echo    - Connect GitHub (use srkkhan141515603-oss)
echo    - Create new Web Service
echo    - Select nikolas-bot repository
echo.
echo 5️⃣ Add GitHub Secrets (for GitHub Actions):
echo.
echo    - Go to Settings ^> Secrets and Variables ^> Actions
echo    - Add DERIV_API_TOKEN
echo    - Add GOOGLE_SHEETS_WEBHOOK (optional)
echo.
echo 📖 Full guide: See DEPLOYMENT.md
echo.
echo 🤖 Your bot will run 24/7! ✨
echo.

pause
