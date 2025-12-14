#!/bin/bash
# Quick GitHub Deployment Setup Script

echo "╔════════════════════════════════════════════╗"
echo "║  🤖 Nikolas Bot - GitHub Deployment Setup  ║"
echo "║  Username: srkkhan141515603-oss           ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null
then
    echo "❌ Git is not installed!"
    echo "Install from: https://git-scm.com/"
    exit 1
fi

echo "✅ Git detected: $(git --version)"
echo ""

# Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git config user.name "srkkhan141515603-oss"
    git config user.email "your_email@github.com"
    echo "✅ Git initialized"
    echo ""
fi

# Add files
echo "📦 Adding all files..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "🚀 Initial Nikolas Bot commit with 24/7 deployment setup"

# Show git status
echo ""
echo "📊 Current git status:"
git status

# Instructions
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  ✅ NEXT STEPS                             ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "1️⃣ Create repository on GitHub:"
echo "   https://github.com/new"
echo "   Repository name: nikolas-bot"
echo ""
echo "2️⃣ Add remote (copy-paste):"
echo ""
echo "   git remote add origin https://github.com/srkkhan141515603-oss/nikolas-bot.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3️⃣ Deploy to Railway (RECOMMENDED):"
echo ""
echo "   npm install -g @railway/cli"
echo "   railway login"
echo "   railway init"
echo "   railway up"
echo ""
echo "4️⃣ Or Deploy to Render:"
echo ""
echo "   - Go to: https://render.com"
echo "   - Connect GitHub (use srkkhan141515603-oss)"
echo "   - Create new Web Service"
echo "   - Select nikolas-bot repository"
echo ""
echo "5️⃣ Add GitHub Secrets (for GitHub Actions):"
echo ""
echo "   - Go to Settings → Secrets and Variables → Actions"
echo "   - Add DERIV_API_TOKEN"
echo "   - Add GOOGLE_SHEETS_WEBHOOK (optional)"
echo ""
echo "📖 Full guide: See DEPLOYMENT.md"
echo ""
echo "🤖 Your bot will run 24/7! ✨"
echo ""
