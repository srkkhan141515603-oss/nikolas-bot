// Simple Express server to run the Nikolas Bot on Google Cloud
// Usage: node server.js

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Serve the React app for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     🤖 NIKOLAS BOT - RUNNING ON GOOGLE CLOUD            ║
╚══════════════════════════════════════════════════════════╝

✅ Server running at: http://localhost:${PORT}
⏰ Time: ${new Date().toLocaleString()}
🔄 Process: ${process.pid}
📊 Node version: ${process.version}

✨ Bot is ready to accept trading signals!
💰 Logs are being sent to Google Sheets in real-time

To view logs: pm2 logs nikolas-bot
To check status: pm2 status
To restart: pm2 restart nikolas-bot

══════════════════════════════════════════════════════════
  `);
});
