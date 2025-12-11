#!/bin/bash

# Nikolas Bot - Google Cloud Deployment Script
# This script automates the entire setup process

set -e

echo "
╔════════════════════════════════════════════════════════╗
║   🚀 NIKOLAS BOT - GOOGLE CLOUD SETUP SCRIPT         ║
╚════════════════════════════════════════════════════════╝
"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: System Updates
echo -e "${YELLOW}[1/7] Updating system packages...${NC}"
sudo apt update -qq
sudo apt upgrade -y -qq

# Step 2: Install Node.js
echo -e "${YELLOW}[2/7] Installing Node.js v18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - -qq
    sudo apt install -y nodejs -qq
fi
echo -e "${GREEN}✓ Node.js $(node --version) installed${NC}"

# Step 3: Install Git
echo -e "${YELLOW}[3/7] Installing Git...${NC}"
sudo apt install -y git -qq
echo -e "${GREEN}✓ Git installed${NC}"

# Step 4: Clone or setup repository
echo -e "${YELLOW}[4/7] Setting up repository...${NC}"
if [ ! -d "nikolas-bot" ]; then
    echo "Enter your GitHub repo URL (or press Enter to use local code):"
    read REPO_URL
    if [ -n "$REPO_URL" ]; then
        git clone $REPO_URL nikolas-bot
        cd nikolas-bot
    fi
fi
cd nikolas-bot

# Step 5: Install dependencies
echo -e "${YELLOW}[5/7] Installing npm dependencies...${NC}"
npm install --silent
npm run build --silent
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 6: Install PM2
echo -e "${YELLOW}[6/7] Installing PM2 process manager...${NC}"
sudo npm install -g pm2 -qq
pm2 install pm2-logrotate
echo -e "${GREEN}✓ PM2 installed${NC}"

# Step 7: Start bot with PM2
echo -e "${YELLOW}[7/7] Starting bot with PM2...${NC}"
pm2 start server.js --name "nikolas-bot" --watch
pm2 startup
pm2 save
echo -e "${GREEN}✓ Bot started${NC}"

echo "
╔════════════════════════════════════════════════════════╗
║         ✅ DEPLOYMENT COMPLETE!                       ║
╚════════════════════════════════════════════════════════╝

🔗 Access your bot at: http://EXTERNAL_IP:3000

📊 Check status:
   pm2 status

📝 View logs:
   pm2 logs nikolas-bot

🔄 Restart bot:
   pm2 restart nikolas-bot

🛑 Stop bot:
   pm2 stop nikolas-bot

⚙️  Configure:
   1. Open http://EXTERNAL_IP:3000
   2. Enter your Deriv API token
   3. Paste Google Sheets webhook URL
   4. Click 'Start Algorithm'

💰 Your bot is now trading 24/7!

════════════════════════════════════════════════════════
"
