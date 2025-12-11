# ✅ Google Cloud Deployment Checklist

## Pre-Deployment (Local)
- [ ] Bot runs locally at `http://localhost:5173` or `http://localhost:5174`
- [ ] Google Sheets webhook URL is working
- [ ] You have your Deriv API token ready
- [ ] `npm run build` completes without errors

## Google Cloud Setup
- [ ] Google Cloud account created (https://console.cloud.google.com)
- [ ] Billing enabled (you get $300 free credits)
- [ ] Project created (name: `nikolas-bot`)
- [ ] VM instance created:
  - [ ] Name: `nikolas-bot`
  - [ ] Region: `us-central1`
  - [ ] Machine: `e2-micro`
  - [ ] OS: Ubuntu 22.04 LTS
  - [ ] External IP assigned
  - [ ] Firewall allows ports 80, 443, 3000

## Deployment Steps
- [ ] SSH connected to VM successfully
- [ ] `sudo apt update` completed
- [ ] Node.js v18+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Code uploaded/cloned to VM
- [ ] `npm install` completed
- [ ] `npm run build` completed
- [ ] PM2 installed globally (`pm2 --version`)
- [ ] `pm2 start server.js --name "nikolas-bot"` successful
- [ ] PM2 startup enabled (`pm2 startup` → `pm2 save`)
- [ ] Bot shows as online: `pm2 status`

## Post-Deployment Verification
- [ ] Bot accessible at `http://EXTERNAL_IP:3000`
- [ ] Bot interface loads
- [ ] Can enter Deriv API token
- [ ] Can enter Google Sheets webhook URL
- [ ] "Google Sheets Logging" shows ✅ Configured
- [ ] Can click "Start Algorithm"
- [ ] PM2 logs show bot starting: `pm2 logs nikolas-bot`
- [ ] Google Sheet receives first test entry

## Monitoring Setup
- [ ] Bookmark PM2 status page
- [ ] Know how to view logs: `pm2 logs nikolas-bot`
- [ ] Know how to restart: `pm2 restart nikolas-bot`
- [ ] Know how to stop: `pm2 stop nikolas-bot`
- [ ] Set up Google Sheet alerts (optional)

## Security
- [ ] API token not stored in code (only in UI)
- [ ] Firewall restricts unnecessary ports (optional)
- [ ] Google Sheets webhook URL is private
- [ ] Only you have access to Google Cloud project

## Maintenance
- [ ] Check logs weekly
- [ ] Monitor Google Sheet for trading activity
- [ ] Check GCP billing page monthly
- [ ] Update bot code if needed (`git pull`)

## Troubleshooting
If something doesn't work:
1. Check PM2 logs: `pm2 logs nikolas-bot`
2. Check VM logs: `journalctl -u google-startup-scripts.service`
3. Verify firewall rules allow port 3000
4. Restart bot: `pm2 restart nikolas-bot`
5. Check bot loads on local network

---

## Commands Reference

**View bot status:**
```bash
pm2 status
```

**View live logs:**
```bash
pm2 logs nikolas-bot
```

**Restart bot:**
```bash
pm2 restart nikolas-bot
```

**Stop bot:**
```bash
pm2 stop nikolas-bot
```

**Start bot:**
```bash
pm2 start nikolas-bot
```

**View all PM2 processes:**
```bash
pm2 list
```

**SSH into VM:**
```bash
gcloud compute ssh nikolas-bot --zone=us-central1-a
```

---

## Success Indicators

✅ Bot is running 24/7 when:
- PM2 shows "online" status
- Google Sheet receives logs in real-time
- Bot responds at `http://EXTERNAL_IP:3000`
- No errors in `pm2 logs`
- CPU/Memory usage is low (< 20%)

---

## Need Help?

**Bot not starting:**
- Check: `pm2 logs nikolas-bot`
- Verify: `npm run build` worked
- Restart: `pm2 restart nikolas-bot`

**Google Sheets not logging:**
- Verify webhook URL in bot settings
- Check Google Apps Script has correct Sheet ID
- Test webhook: Copy URL into browser

**VM too slow:**
- Upgrade to `e2-small` (costs ~$10 more)
- Check: `top` to see CPU/memory usage
- Reduce update frequency if needed

**High GCP bills:**
- Check: `gcloud compute instances list`
- Stop unused instances
- Set billing alerts

---

Date Deployed: _______________
External IP: _______________
Notes: _______________
