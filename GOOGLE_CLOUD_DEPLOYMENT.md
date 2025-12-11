# 🚀 Deploy Nikolas Bot to Google Cloud (24/7)

## Overview
Run your bot continuously on Google Cloud Linux VM for 24/7 trading without your computer.

**Cost:** ~$15-30/month (free tier available for 90 days)

---

## Step 1: Create Google Cloud Account

1. Go to https://cloud.google.com
2. Click **"Start free"**
3. Sign in with Google
4. Add billing info (you get $300 free credits for 90 days)
5. Create a new project: Name it `nikolas-bot`

---

## Step 2: Create Linux VM

1. In Google Cloud Console, go to **Compute Engine** → **VM instances**
2. Click **Create Instance**
3. Configure:
   - **Name:** `nikolas-bot`
   - **Region:** `us-central1` (or closest to you)
   - **Zone:** `us-central1-a`
   - **Machine type:** `e2-micro` (free tier eligible, 0.25-2 vCPU)
   - **Boot disk:** Ubuntu 22.04 LTS, 30 GB
   - **Firewall:** Allow HTTP and HTTPS
4. Click **Create**
5. Wait 2-3 minutes for VM to start

---

## Step 3: Connect to VM

### Option A: Using Cloud Shell (Easiest)
1. In Google Cloud Console, click **Activate Cloud Shell** (>_ icon, top right)
2. Terminal opens at bottom of screen
3. Skip to Step 4

### Option B: Using SSH Client
1. Click on your VM instance name
2. Click **SSH** button → Opens in new window
3. Skip to Step 4

---

## Step 4: Install Node.js & Git

Run these commands in your VM terminal:

```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js (v18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install Git
sudo apt install -y git
```

---

## Step 5: Clone Your Bot Repository

If you have your code on GitHub:

```bash
git clone https://github.com/YOUR_USERNAME/nikolas-bot.git
cd nikolas-bot
```

**OR** if you don't have GitHub, upload files:

1. In Cloud Shell, run:
```bash
# Create directory
mkdir nikolas-bot
cd nikolas-bot
```

2. Then upload your bot files from your computer (use Cloud Shell file upload)

---

## Step 6: Install Dependencies

```bash
# Install npm packages
npm install

# Build the app
npm run build
```

---

## Step 7: Create Bot Runner Script

Create a new file: `run-bot.js`

```bash
cat > run-bot.js << 'EOF'
// Simple Node.js server to run the bot
const express = require('express');
const path = require('path');
const app = express();

// Serve built frontend
app.use(express.static(path.join(__dirname, 'dist')));

// API endpoint for Google Sheets logging (if needed)
app.post('/api/log', (req, res) => {
  console.log('Log received:', req.body);
  res.json({ success: true });
});

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Nikolas Bot running on http://localhost:${PORT}`);
});
EOF
```

---

## Step 8: Install PM2 (Process Manager)

PM2 keeps your bot running 24/7 and restarts if it crashes:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start your bot with PM2
pm2 start run-bot.js --name "nikolas-bot"

# Make PM2 startup on reboot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER
pm2 save

# Check status
pm2 status
pm2 logs nikolas-bot
```

---

## Step 9: Set Firewall Rules

1. In Google Cloud Console → **VPC network** → **Firewall rules**
2. Click **Create Firewall Rule**
3. Configure:
   - **Name:** `allow-nikolas-bot`
   - **Direction:** Ingress
   - **Targets:** All instances
   - **Source IP ranges:** `0.0.0.0/0`
   - **Protocols:** TCP port `3000`
4. Click **Create**

---

## Step 10: Access Your Bot

1. In Compute Engine, find your VM's **External IP** address
2. Open in browser: `http://EXTERNAL_IP:3000`
3. Bot interface loads!

---

## Step 11: Configure Bot for Cloud

Since you can't interact with the UI 24/7, create a startup config:

**Create `config.json`:**

```bash
cat > config.json << 'EOF'
{
  "accountType": "demo",
  "symbol": "R_100",
  "tradeAmount": 1,
  "tradeDuration": 7,
  "targetProfit": 20,
  "stopLoss": 30,
  "maxTrades": 20,
  "autoCooldownOnTakeProfit": true,
  "autoCooldownDuration": 60,
  "useMartingale": false,
  "googleSheetsWebhook": "YOUR_GOOGLE_APPS_SCRIPT_URL"
}
EOF
```

**Create `start-bot.sh`:**

```bash
cat > start-bot.sh << 'EOF'
#!/bin/bash

# Start the bot with saved configuration
export NODE_ENV=production
export PORT=3000

pm2 start run-bot.js --name "nikolas-bot"
pm2 logs nikolas-bot
EOF

chmod +x start-bot.sh
```

---

## Step 12: Monitor Your Bot

### View Logs:
```bash
pm2 logs nikolas-bot

# Or watch live
pm2 monit
```

### Restart Bot:
```bash
pm2 restart nikolas-bot
```

### Stop Bot:
```bash
pm2 stop nikolas-bot
```

### Bot Status:
```bash
pm2 status
```

---

## Step 13: Check Google Sheets Logging

1. Open your Google Sheet: `Nikolas Bot Logs`
2. Check `Bot Logs` sheet
3. Logs should appear in real-time as bot trades!
4. Verify connection is working

---

## Cost Estimate

| Component | Cost |
|-----------|------|
| e2-micro VM (1 CPU, 1GB RAM) | $6-9/month |
| 30GB disk | $0.40/month |
| Outbound traffic | $0.12 per GB |
| **TOTAL** | **$15-30/month** |

**Free tier covers:** First 3 months (90 days) = $0

---

## Troubleshooting

### Bot not accessible
```bash
# Check if running
pm2 status

# Check firewall
gcloud compute firewall-rules list

# Check logs
pm2 logs nikolas-bot
```

### Google Sheets not logging
```bash
# Test webhook URL
curl -X POST -H "Content-Type: application/json" \
  -d '{"status":"test","profit":10}' \
  YOUR_GOOGLE_APPS_SCRIPT_URL
```

### High CPU/Memory usage
```bash
# Check usage
top
ps aux | grep node

# Increase VM resources
# In GCP Console: Stop VM → Edit → Increase machine type → Restart
```

### Bot crashes
```bash
# View detailed logs
pm2 logs nikolas-bot --lines 100

# Restart
pm2 restart nikolas-bot
```

---

## Security Tips

1. **Protect your API token:**
   - Use environment variables, not hardcoded values
   - Store in `~/.env` file

2. **Use SSL/HTTPS:**
   - Set up with Let's Encrypt (optional)
   - Add reverse proxy with Nginx

3. **Limit access:**
   - Restrict firewall rules to your IP
   - Use VPN for remote access

4. **Monitor costs:**
   - Set billing alerts in GCP
   - Use `gcloud compute instances describe nikolas-bot` to check usage

---

## Advanced: Auto-Trading Script

Create `auto-trade.sh` to auto-start trading on boot:

```bash
cat > auto-trade.sh << 'EOF'
#!/bin/bash

# Wait for bot to fully load
sleep 5

# Send start command via webhook (if you add API endpoint)
curl -X POST http://localhost:3000/api/start-trading \
  -H "Content-Type: application/json" \
  -d '{"apiToken":"YOUR_TOKEN","accountType":"demo"}'
EOF

chmod +x auto-trade.sh
```

---

## That's It! 🚀

Your bot is now running **24/7 on Google Cloud**:
- ✅ Runs even when your computer is off
- ✅ Auto-restarts if it crashes
- ✅ Logs to Google Sheets in real-time
- ✅ Accessible from anywhere
- ✅ Affordable ($15-30/month or free for 3 months)

**Next steps:**
1. Deploy VM
2. Upload code
3. Run `pm2 start`
4. Monitor logs
5. Check Google Sheets for trades!

Questions? Run `pm2 help` or `gcloud compute --help`
