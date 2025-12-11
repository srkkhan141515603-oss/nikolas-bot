# 📊 Google Sheets Bot Logging Setup Guide

## Complete Setup (5 minutes)

### Step 1: Create Google Sheets
1. Go to https://sheets.google.com
2. Click **"Create new spreadsheet"**
3. Name it: `Nikolas Bot Logs`
4. **Copy the Sheet ID from URL**
   - URL format: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`
   - Save the `YOUR_SHEET_ID` part (between `/d/` and `/edit`)

### Step 2: Create Google Apps Script
1. Go to https://script.google.com
2. Click **"New Project"**
3. Name it: `Nikolas Bot Logger`
4. **Delete all default code** (if any)
5. **Copy & Paste this code:**

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Open spreadsheet with YOUR_SHEET_ID
    let spreadsheet = SpreadsheetApp.openById('YOUR_SHEET_ID');
    let sheet = spreadsheet.getSheetByName('Bot Logs');
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Bot Logs', 0);
      sheet.appendRow(['Timestamp', 'Status', 'Profit ($)', 'Trades', 'Session #', 'Win Rate (%)', 'Notes']);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    }
    
    // Append data
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString(),
      data.status || 'unknown',
      data.profit || 0,
      data.trades || 0,
      data.session || 0,
      data.winRate || 0,
      data.notes || ''
    ]);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 7);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data logged successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

6. **Replace `YOUR_SHEET_ID`** with the ID you copied from Step 1
7. Press **Ctrl+S** to save
8. Click **"Deploy"** button (top right)
9. Choose **"New Deployment"**
10. Set Type: **"Web app"**
11. Execute as: **Your Email**
12. Allow access to: **"Anyone"**
13. Click **"Deploy"**
14. **Copy the Deployment URL** (shown in green box)
    - Looks like: `https://script.googleapis.com/macros/d/.../usercontent`

### Step 3: Add URL to Bot
1. Go back to your Nikolas Bot app
2. Scroll to **"Google Sheets Logging"** section
3. Paste the Deployment URL from Step 2 into the text field
4. You'll see **"✅ Configured - Logging Active"**

## What Gets Logged?

| Event | Details Logged |
|-------|--------|
| **Trading Started** 🚀 | Timestamp, symbol, trade amount |
| **Bot Frozen** 🔴 | Timestamp, profit, trades, reason |
| **Bot Disconnected** ❌ | Timestamp, profit, trades, reason |
| **Session Completed** 📊 | Timestamp, profit, wins/losses, win rate, reason (TP/SL) |

## View Your Logs

1. Go to your Google Sheet: https://sheets.google.com
2. Open **"Nikolas Bot Logs"** spreadsheet
3. Scroll through **"Bot Logs"** sheet
4. Timestamps auto-update as bot runs
5. All data is preserved forever!

## Features

✅ **Completely Free** - Uses Google's free services  
✅ **Automatic** - No manual logging needed  
✅ **Non-Blocking** - Sends in background, zero bot impact  
✅ **Persistent** - Data saved forever in Google Sheets  
✅ **Secure** - Only you can access your sheet  
✅ **Analyzable** - Use Google Sheets charts/pivot tables  

## Troubleshooting

**"Not configured - Paste URL above"**
- Make sure you pasted the **Deployment URL** (not the Sheet ID)
- Should start with `https://script.googleapis.com/macros/`

**Logs not appearing in sheet**
- Check Google Apps Script has correct `YOUR_SHEET_ID`
- Check Sheet has **"Bot Logs"** sheet (or it will create one)
- Check you're looking at the correct Google Sheet

**Script errors in Google Apps Script console**
- Open script.google.com → Executions tab
- View error details
- Most common: Wrong Sheet ID in the code

## That's it! 🎉

Your bot will now automatically log all status changes to Google Sheets. No manual work needed!
