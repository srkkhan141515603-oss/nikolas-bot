# 🚀 Quick Start: Deploy Nikolas Bot to Google Cloud (24/7)

## TL;DR - 5 Steps

### Step 1: Create Google Cloud VM (5 min)
1. Go to https://console.cloud.google.com
2. **Compute Engine** → **VM instances** → **Create**
3. Name: `nikolas-bot`
4. Machine: `e2-micro` (free tier)
5. OS: Ubuntu 22.04 LTS
6. Click **Create**

### Step 2: Connect to VM (1 min)
1. Click SSH button next to your VM
2. Terminal opens in browser

### Step 3: Run Deployment Script (3 min)
Paste this in the terminal:

```bash
sudo apt install -y git
git clone https://github.com/YOUR_USERNAME/nikolas-bot.git
cd nikolas-bot
chmod +x deploy.sh
./deploy.sh
```

**OR if no GitHub repo:**
```bash
# Create directory and upload your files
mkdir nikolas-bot
cd nikolas-bot
# Then upload your bot files from local computer
```

### Step 4: Build and Deploy
```bash
npm install
npm run build
npm install -g pm2
pm2 start server.js --name "nikolas-bot"
pm2 startup
pm2 save
```

### Step 5: Access Your Bot
1. In Google Cloud console, find your VM's **External IP**
2. Open: `http://YOUR_EXTERNAL_IP:3000`
3. Enter Deriv API token
4. Enter Google Sheets webhook URL
5. Click **Start Algorithm**

---

## That's It! 🎉

Your bot now runs 24/7 automatically:
- ✅ Trades even when your computer is off
- ✅ Logs to Google Sheets in real-time
- ✅ Auto-restarts if it crashes
- ✅ Costs $15-30/month (free for 3 months)

---

## Monitor Your Bot

**View logs:**
```bash
pm2 logs nikolas-bot
```

**Check status:**
```bash
pm2 status
```

**Restart if needed:**
```bash
pm2 restart nikolas-bot
```

**Stop bot:**
```bash
pm2 stop nikolas-bot
```

---

## Common Issues

**Can't access bot?**
- Check firewall allows port 3000
- Make sure External IP is correct
- Wait 30 seconds for bot to fully start

**Google Sheets not logging?**
- Make sure webhook URL is pasted correctly
- Check Google Apps Script has right Sheet ID
- View PM2 logs: `pm2 logs nikolas-bot`

**Bot crashes?**
- PM2 auto-restarts it
- Check logs: `pm2 logs nikolas-bot --lines 50`

---

## Files Included

- **`server.js`** - Express server for cloud deployment
- **`deploy.sh`** - Automatic setup script
- **`GOOGLE_CLOUD_DEPLOYMENT.md`** - Detailed guide
- **`GOOGLE_SHEETS_SETUP.md`** - Google Sheets logging setup

---

## Cost

- **First 90 days:** FREE ($300 Google Cloud credits)
- **After:** ~$15-30/month for `e2-micro` VM

---

## Next Steps

1. Create Google Cloud VM ✓
2. Connect via SSH ✓
3. Run deployment ✓
4. Access at `http://IP:3000` ✓
5. Trade 24/7! 🚀

Happy trading! 💰
