# 🤖 Nikolas Bot - 24/7 GitHub Deployment Guide

## Overview
Run your Nikolas Binary Trading Bot 24/7 on GitHub using GitHub Actions or deploy to cloud services.

---

## ✅ Option 1: GitHub Actions (Free - Limited)

### Setup Instructions

#### Step 1: Push to GitHub
```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial Nikolas Bot commit"
git remote add origin https://github.com/srkkhan141515603-oss/nikolas-bot.git
git branch -M main
git push -u origin main
```

#### Step 2: Add GitHub Secrets
1. Go to: `https://github.com/srkkhan141515603-oss/nikolas-bot/settings/secrets/actions`
2. Click "New repository secret"
3. Add these secrets:
   - `DERIV_API_TOKEN` - Your Deriv API token
   - `GOOGLE_SHEETS_WEBHOOK` - (Optional) Your Google Sheets webhook

#### Step 3: Enable Actions
1. Go to Actions tab
2. Click "I understand my workflows, go ahead and enable them"
3. Workflow runs automatically every 4 hours

### GitHub Actions Limits
- **Free tier**: 2000 minutes/month (about 83 hours)
- **Duration**: Runs check every 4 hours
- **Best for**: Testing and monitoring, NOT 24/7 trading

---

## ✨ Option 2: Deploy to Railway.app (RECOMMENDED - 24/7)

Railway offers free hosting with 10GB/month bandwidth - perfect for 24/7 bot!

### Step 1: Create Railway Account
1. Go to: https://railway.app
2. Sign up with GitHub (use srkkhan141515603-oss)
3. Authorize Railway

### Step 2: Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Select "Node.js" when prompted
# Select "npm run preview" for start command
```

### Step 3: Add Environment Variables
```bash
railway variables add DERIV_API_TOKEN="your_token_here"
railway variables add NODE_ENV="production"
railway variables add PORT="3000"
```

### Step 4: Deploy
```bash
railway up
```

**Deployment Link**: Your bot runs at: `https://your-project-name.railway.app`

---

## 🚀 Option 3: Deploy to Render.com (EASY - 24/7)

### Step 1: Create Render Account
1. Go to: https://render.com
2. Sign up with GitHub
3. Authorize access

### Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Select your nikolas-bot repo
4. Fill in details:
   - **Name**: nikolas-bot
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run preview`

### Step 3: Set Environment Variables
1. Scroll to "Environment"
2. Add:
   ```
   DERIV_API_TOKEN=your_token_here
   NODE_ENV=production
   PORT=3000
   ```

### Step 4: Deploy
- Click "Create Web Service"
- Wait for deployment (2-3 minutes)
- Bot runs at: `https://nikolas-bot.onrender.com`

---

## 🔧 Option 4: Deploy to Heroku (Free Tier Discontinued)

Heroku free tier is no longer available. Use Railway or Render instead.

---

## 📱 GitHub Account Setup

Your GitHub username: `srkkhan141515603-oss`

### Recommended Workflow:
1. **Local Development**: Run `npm run dev`
2. **Testing**: Use GitHub Actions workflow
3. **Production**: Deploy to Railway or Render
4. **Backup**: Push code regularly to GitHub

---

## 🔐 Securing Your API Token

### DO NOT commit tokens to GitHub!

#### Safe Method:
```bash
# Create .env file (ignored by git)
echo "DERIV_API_TOKEN=your_token" > .env

# Add to .gitignore
echo ".env" >> .gitignore

# Commit
git add .
git commit -m "Add env support"
git push
```

#### For GitHub Actions:
Use **Secrets** instead of .env:
- Settings → Secrets and Variables → Actions
- Add `DERIV_API_TOKEN`
- Reference in workflow: `${{ secrets.DERIV_API_TOKEN }}`

---

## 📊 Monitoring Your Bot

### GitHub Actions
- Go to: Actions tab
- See run logs and status
- Check every 4 hours

### Railway/Render
- Dashboard shows live logs
- See errors in real-time
- Monitor resource usage

### Manual Checks
```bash
# Check if bot is running
curl https://your-deployment-url.com

# View logs on Railway
railway logs

# View logs on Render
# Check dashboard → Logs
```

---

## 🛠️ Troubleshooting

### Bot not starting?
```bash
# Check logs
npm run dev

# Verify Node version
node --version

# Verify dependencies
npm list
```

### API token not working?
- Verify token format
- Check it has correct permissions
- Try regenerating token

### Port already in use?
```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📈 Performance Tips

### For Railway/Render:
- Keep `NODE_ENV=production`
- Use `npm run build && npm run preview`
- Monitor logs for errors
- Restart if bot hangs

### Bot Settings:
- Set `targetProfit: 20` (reasonable daily target)
- Set `stopLoss: 30` (protection)
- Use `demo` account for testing
- Monitor win rate

---

## 🎯 Next Steps

1. ✅ **Push to GitHub**
   ```bash
   git push -u origin main
   ```

2. ✅ **Choose Deployment**
   - GitHub Actions: Free but limited
   - Railway: Recommended for 24/7
   - Render: Easy setup, good uptime

3. ✅ **Configure Secrets**
   - Add API tokens
   - Set environment variables

4. ✅ **Test**
   - Verify bot starts
   - Check logs
   - Monitor first trades

5. ✅ **Monitor**
   - Set up alerts
   - Review trades daily
   - Adjust settings as needed

---

## 📞 Support

For issues:
- Check GitHub Issues
- Review deployment logs
- Verify API tokens
- Test locally first

**Your Bot is Ready!** 🚀

Choose Railway or Render for best 24/7 performance!
