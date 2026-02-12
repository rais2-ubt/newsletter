# Email Setup Guide

This guide walks you through setting up email sending for the RAIS² Newsletter Manager. Once configured, you can send newsletters directly to your subscribers via Gmail.

## How It Works

The RAIS² Newsletter Manager uses **Google Apps Script** as a free email bridge:
- Your newsletters are sent through your Gmail account
- Subscriber data is stored in a Google Sheet
- Everything runs through Google's infrastructure — reliable and free
- Gmail allows up to 100 emails/day (regular) or 1,500/day (Google Workspace)

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Newsletter  │────▶│  Google Apps      │────▶│  Gmail      │
│  Manager     │     │  Script           │     │  (sends)    │
│  (browser)   │     │  (your account)   │     │             │
└──────────────┘     └────────┬─────────┘     └─────────────┘
                              │
                     ┌────────┴─────────┐
                     │  Google Sheet    │
                     │  (subscribers)   │
                     └──────────────────┘
```

## Prerequisites

- A Google account (Gmail or Google Workspace)
- Access to the RAIS² Newsletter Manager (running locally)

## Step 1: Create a Google Sheet for Subscribers

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it something clear, like **"RAIS2 Newsletter Subscribers"**
3. In the first sheet tab, make sure it's named **"Subscribers"** (click the tab at the bottom to rename it)
4. In row 1, add these column headers (one per cell, starting from column A):

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| id | email | name | status | subscribedAt | unsubscribedAt | source | confirmToken |

5. Save the spreadsheet
6. **Copy the Sheet ID** from the URL. The URL looks like:
   ```
   https://docs.google.com/spreadsheets/d/ABC123xyz.../edit
   ```
   The Sheet ID is the long string between `/d/` and `/edit` — in this example: `ABC123xyz...`

> **Keep this ID handy** — you'll need it in Step 3.

## Step 2: Create a Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **New project** (the "+" button)
3. You'll see a file called `Code.gs` with some default code
4. **Delete all the default code** in `Code.gs`
5. Open the file `docs/apps-script-code.gs` from the RAIS² project folder on your computer
6. **Copy the entire contents** of that file
7. **Paste it** into `Code.gs` in the Apps Script editor
8. Click the **Save** icon (or press Ctrl+S / Cmd+S)
9. Give your project a name, like **"RAIS2 Email Service"**

## Step 3: Configure the Script

1. In the Apps Script editor, click the **gear icon** on the left sidebar to open **Project Settings**
2. Scroll down to **Script Properties**
3. Click **Add script property**
4. Set:
   - **Property**: `SHEET_ID`
   - **Value**: The Sheet ID you copied in Step 1
5. Click **Save script properties**

## Step 4: Deploy as Web App

1. In the Apps Script editor, click **Deploy** → **New deployment**
2. Click the **gear icon** next to "Select type" and choose **Web app**
3. Configure:
   - **Description**: "RAIS2 Email Service" (or anything you like)
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: **Anyone**
4. Click **Deploy**
5. Google will ask you to **authorize** the app:
   - Click **Authorize access**
   - Choose your Google account
   - You may see a warning "Google hasn't verified this app" — click **Advanced** → **Go to RAIS2 Email Service (unsafe)**
   - Click **Allow** (this grants the script permission to send emails via your Gmail and access your Sheet)
6. After deployment, you'll see a **Web App URL** that looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
7. **Copy this URL** — you'll need it in the next step

> **Important:** Every time you change the code and want the changes to take effect, you need to create a **new deployment** (Deploy → New deployment). The URL changes each time.

## Step 5: Connect to RAIS² Newsletter Manager

1. Open the RAIS² Newsletter Manager in your browser (http://localhost:8080)
2. Go to **Settings** (in the sidebar)
3. In the **Email Configuration** section:
   - Paste your **Web App URL** into the URL field
   - Set your **From Name** (e.g., "RAIS² Newsletter")
   - Set a **Reply-To** email address
4. Click **Test Connection** — you should see a green "Connected" status
5. Click **Send Test Email** — enter your email address to receive a test

> **What you should see:** A test email in your inbox from "RAIS² Newsletter" with a green header saying "Test Email Successful!"

## You're Done!

Now you can:
- Send newsletters from the **Archive** page
- Manage subscribers on the **Subscribers** page (they sync with your Google Sheet)
- Subscribers can unsubscribe via a link in every email

## Troubleshooting

### "Google hasn't verified this app" warning
This is normal for personal Apps Script projects. Click **Advanced** → **Go to [project name] (unsafe)** to proceed. The "unsafe" label just means Google hasn't reviewed the code, but you wrote it yourself.

### Test connection fails
- Make sure the Web App URL is correct (ends with `/exec`)
- Check that the deployment is set to "Anyone" access
- Try creating a new deployment

### Emails not being received
- Check your Gmail spam folder
- Verify the subscriber's email is correct
- Check Gmail's daily sending quota (100/day for free Gmail, 1,500/day for Workspace)

### "SHEET_ID not configured" error
- Go to Apps Script → Project Settings → Script Properties
- Make sure the `SHEET_ID` property exists and has the correct value

### Changes to the script not working
- You need to create a **new deployment** each time you change the code
- The old deployment URL will still use the old code
- Copy the new URL and update it in the RAIS² Settings
