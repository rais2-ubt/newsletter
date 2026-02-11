/**
 * RAIS2 Newsletter Email Service
 * Google Apps Script for sending newsletters via Gmail + Google Sheets subscriber management
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com/ and create a new project
 * 2. Copy this entire code into Code.gs
 * 3. Create a Google Sheet with a "Subscribers" tab and headers:
 *    id, email, name, status, subscribedAt, unsubscribedAt, source, confirmToken
 * 4. Go to Project Settings > Script Properties and add:
 *    SHEET_ID = your spreadsheet ID (from the URL)
 * 5. Click Deploy > New deployment > Web app
 * 6. Set "Execute as" to "Me" and "Who has access" to "Anyone"
 * 7. Click Deploy and authorize the app (allow Gmail + Sheets access)
 * 8. Copy the Web App URL and paste it in your RAIS2 Newsletter settings
 */

// Configuration
const CONFIG = {
  FROM_NAME: 'RAIS2 Newsletter',
  UNSUBSCRIBE_BASE: '', // Will use Apps Script URL for unsubscribe
  RATE_LIMIT_DELAY: 1000, // ms between emails
  SHEET_NAME: 'Subscribers'
};

// ===== SHEET ACCESS FUNCTIONS =====

/**
 * Get the spreadsheet by ID from Script Properties
 */
function getSpreadsheet() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) {
    throw new Error('SHEET_ID not configured. Go to Project Settings > Script Properties and add SHEET_ID.');
  }
  return SpreadsheetApp.openById(sheetId);
}

/**
 * Get the Subscribers sheet
 */
function getSubscribersSheet() {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" not found. Please create it with the required headers.');
  }
  return sheet;
}

/**
 * Generate a unique ID
 */
function generateId() {
  return 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Find subscriber row by email
 * Returns { row: number, data: object } or null
 */
function findSubscriberByEmail(email) {
  const sheet = getSubscribersSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().toLowerCase() === email.toLowerCase()) {
      const subscriber = {};
      headers.forEach((h, idx) => subscriber[h] = data[i][idx]);
      return { row: i + 1, data: subscriber };
    }
  }
  return null;
}

// ===== REQUEST HANDLERS =====

/**
 * Handle POST requests from the static site
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!data.action) {
      return createResponse(false, 'Missing action parameter');
    }

    switch (data.action) {
      // Email actions
      case 'test':
        return handleTestEmail(data);
      case 'sendSingle':
        return handleSendSingle(data);
      case 'send':
        return handleSendNewsletter(data);

      // Subscriber actions
      case 'getSubscribers':
        return handleGetSubscribers(data);
      case 'addSubscriber':
        return handleAddSubscriber(data);
      case 'updateSubscriber':
        return handleUpdateSubscriber(data);
      case 'removeSubscriber':
        return handleRemoveSubscriber(data);
      case 'syncSubscribers':
        return handleSyncSubscribers(data);

      default:
        return createResponse(false, 'Unknown action: ' + data.action);
    }
  } catch (error) {
    return createResponse(false, 'Error: ' + error.message);
  }
}

/**
 * Handle GET requests (status check + unsubscribe)
 */
function doGet(e) {
  const action = e.parameter.action;

  // Handle unsubscribe
  if (action === 'unsubscribe') {
    return handleUnsubscribe(e.parameter);
  }

  // Handle subscription confirmation (double opt-in)
  if (action === 'confirm') {
    return handleConfirmSubscription(e.parameter);
  }

  // Default: return service status
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'RAIS2 Newsletter Email Service is running',
    version: '2.0.0',
    features: ['email', 'sheets']
  })).setMimeType(ContentService.MimeType.JSON);
}

// ===== SUBSCRIBER HANDLERS =====

/**
 * Get all subscribers from the Sheet
 */
function handleGetSubscribers(data) {
  try {
    const sheet = getSubscribersSheet();
    const rows = sheet.getDataRange().getValues();

    if (rows.length <= 1) {
      return createResponse(true, { subscribers: [] });
    }

    const headers = rows[0];
    const subscribers = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[1]) continue; // Skip rows without email

      const subscriber = {};
      headers.forEach((h, idx) => {
        subscriber[h] = row[idx];
      });

      // Convert dates to ISO strings
      if (subscriber.subscribedAt instanceof Date) {
        subscriber.subscribedAt = subscriber.subscribedAt.toISOString();
      }
      if (subscriber.unsubscribedAt instanceof Date) {
        subscriber.unsubscribedAt = subscriber.unsubscribedAt.toISOString();
      }

      // Filter by status if specified
      if (data.status && subscriber.status !== data.status) {
        continue;
      }

      subscribers.push(subscriber);
    }

    return createResponse(true, { subscribers: subscribers });
  } catch (error) {
    return createResponse(false, 'Failed to get subscribers: ' + error.message);
  }
}

/**
 * Add a new subscriber
 */
function handleAddSubscriber(data) {
  try {
    if (!data.email) {
      return createResponse(false, 'Email is required');
    }

    const email = data.email.trim().toLowerCase();

    // Check for existing subscriber
    const existing = findSubscriberByEmail(email);
    if (existing) {
      // If unsubscribed, reactivate
      if (existing.data.status === 'unsubscribed') {
        const sheet = getSubscribersSheet();
        sheet.getRange(existing.row, 4).setValue('active'); // status
        sheet.getRange(existing.row, 5).setValue(new Date()); // subscribedAt
        sheet.getRange(existing.row, 6).setValue(''); // clear unsubscribedAt
        return createResponse(true, {
          subscriber: { ...existing.data, status: 'active' },
          reactivated: true
        });
      }
      return createResponse(false, 'Email already subscribed');
    }

    // Add new subscriber
    const sheet = getSubscribersSheet();
    const newSubscriber = {
      id: generateId(),
      email: email,
      name: data.name || '',
      status: 'active',
      subscribedAt: new Date(),
      unsubscribedAt: '',
      source: data.source || 'api',
      confirmToken: ''
    };

    sheet.appendRow([
      newSubscriber.id,
      newSubscriber.email,
      newSubscriber.name,
      newSubscriber.status,
      newSubscriber.subscribedAt,
      newSubscriber.unsubscribedAt,
      newSubscriber.source,
      newSubscriber.confirmToken
    ]);

    return createResponse(true, { subscriber: newSubscriber });
  } catch (error) {
    return createResponse(false, 'Failed to add subscriber: ' + error.message);
  }
}

/**
 * Update an existing subscriber
 */
function handleUpdateSubscriber(data) {
  try {
    if (!data.email && !data.id) {
      return createResponse(false, 'Email or ID is required');
    }

    const existing = findSubscriberByEmail(data.email);
    if (!existing) {
      return createResponse(false, 'Subscriber not found');
    }

    const sheet = getSubscribersSheet();
    const row = existing.row;

    // Update fields
    if (data.name !== undefined) {
      sheet.getRange(row, 3).setValue(data.name);
    }
    if (data.status !== undefined) {
      sheet.getRange(row, 4).setValue(data.status);
      if (data.status === 'unsubscribed') {
        sheet.getRange(row, 6).setValue(new Date());
      }
    }

    return createResponse(true, { message: 'Subscriber updated' });
  } catch (error) {
    return createResponse(false, 'Failed to update subscriber: ' + error.message);
  }
}

/**
 * Remove a subscriber
 */
function handleRemoveSubscriber(data) {
  try {
    if (!data.email && !data.id) {
      return createResponse(false, 'Email or ID is required');
    }

    const existing = findSubscriberByEmail(data.email);
    if (!existing) {
      return createResponse(false, 'Subscriber not found');
    }

    const sheet = getSubscribersSheet();
    sheet.deleteRow(existing.row);

    return createResponse(true, { message: 'Subscriber removed' });
  } catch (error) {
    return createResponse(false, 'Failed to remove subscriber: ' + error.message);
  }
}

/**
 * Sync subscribers from admin UI
 */
function handleSyncSubscribers(data) {
  try {
    if (!data.subscribers || !Array.isArray(data.subscribers)) {
      return createResponse(false, 'Subscribers array is required');
    }

    const sheet = getSubscribersSheet();
    const existingData = sheet.getDataRange().getValues();
    const headers = existingData[0];

    // Build map of existing subscribers by email
    const existingMap = new Map();
    for (let i = 1; i < existingData.length; i++) {
      const email = existingData[i][1];
      if (email) {
        existingMap.set(email.toString().toLowerCase(), { row: i + 1, data: existingData[i] });
      }
    }

    let added = 0, updated = 0, unchanged = 0;

    for (const sub of data.subscribers) {
      if (!sub.email) continue;

      const email = sub.email.toLowerCase();
      const existing = existingMap.get(email);

      if (existing) {
        // Update existing
        const needsUpdate = existing.data[2] !== sub.name ||
                          existing.data[3] !== (sub.active === false ? 'unsubscribed' : 'active');

        if (needsUpdate) {
          sheet.getRange(existing.row, 3).setValue(sub.name || '');
          sheet.getRange(existing.row, 4).setValue(sub.active === false ? 'unsubscribed' : 'active');
          updated++;
        } else {
          unchanged++;
        }
        existingMap.delete(email); // Mark as processed
      } else {
        // Add new
        sheet.appendRow([
          sub.id || generateId(),
          email,
          sub.name || '',
          sub.active === false ? 'unsubscribed' : 'active',
          sub.addedAt ? new Date(sub.addedAt) : new Date(),
          '',
          'admin',
          ''
        ]);
        added++;
      }
    }

    return createResponse(true, { added, updated, unchanged });
  } catch (error) {
    return createResponse(false, 'Failed to sync subscribers: ' + error.message);
  }
}

/**
 * Handle unsubscribe (GET request)
 */
function handleUnsubscribe(params) {
  const email = params.email;

  if (!email) {
    return HtmlService.createHtmlOutput(
      '<html><body><h1>Error</h1><p>Missing email parameter.</p></body></html>'
    );
  }

  try {
    const existing = findSubscriberByEmail(email);

    if (existing) {
      const sheet = getSubscribersSheet();
      sheet.getRange(existing.row, 4).setValue('unsubscribed');
      sheet.getRange(existing.row, 6).setValue(new Date());
    }

    // Return success page with redirect
    return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - RAIS2 Newsletter</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #EBEBE4;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #009260; margin-bottom: 10px; }
          p { color: #48535A; line-height: 1.6; }
          .checkmark {
            width: 60px;
            height: 60px;
            background: #e8f5e9;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
          }
          .checkmark svg { width: 30px; height: 30px; fill: #2e7d32; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="checkmark">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <h1>Unsubscribed</h1>
          <p>You have been successfully unsubscribed from the RAIS2 Newsletter.</p>
          <p style="color: #7F8990; font-size: 14px;">If this was a mistake, you can subscribe again at any time.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    return HtmlService.createHtmlOutput(
      '<html><body><h1>Error</h1><p>Something went wrong. Please try again later.</p></body></html>'
    );
  }
}

/**
 * Handle subscription confirmation (double opt-in)
 */
function handleConfirmSubscription(params) {
  // Placeholder for future double opt-in implementation
  return HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head><title>Subscription Confirmed</title></head>
    <body style="font-family: Arial; text-align: center; padding: 40px;">
      <h1 style="color: #009260;">Subscription Confirmed!</h1>
      <p>Thank you for confirming your subscription to the RAIS2 Newsletter.</p>
    </body>
    </html>
  `);
}

// ===== EMAIL HANDLERS =====

/**
 * Send a test email
 */
function handleTestEmail(data) {
  if (!data.toEmail) {
    return createResponse(false, 'Missing toEmail parameter');
  }

  const testHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
      <div style="background: #009260; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">RAIS<sup>2</sup> Newsletter</h1>
      </div>
      <div style="padding: 30px; background: #f5f5f5;">
        <h2 style="color: #48535A;">Test Email Successful!</h2>
        <p style="color: #7F8990; line-height: 1.6;">
          This is a test email from your RAIS2 Newsletter system.
          If you received this, your Google Apps Script configuration is working correctly!
        </p>
        <hr style="border: none; border-top: 2px solid #009260; margin: 20px 0;">
        <p style="color: #7F8990; font-size: 12px;">
          Sent via RAIS2 Newsletter Static Site using Google Apps Script
        </p>
      </div>
    </div>
  `;

  try {
    GmailApp.sendEmail(data.toEmail, 'RAIS2 Newsletter - Test Email', '', {
      htmlBody: testHtml,
      name: data.fromName || CONFIG.FROM_NAME
    });

    return createResponse(true, 'Test email sent successfully to ' + data.toEmail);
  } catch (error) {
    return createResponse(false, 'Failed to send test email: ' + error.message);
  }
}

/**
 * Send newsletter to a single recipient
 */
function handleSendSingle(data) {
  if (!data.toEmail || !data.html || !data.subject) {
    return createResponse(false, 'Missing required parameters (toEmail, html, subject)');
  }

  try {
    // Get unsubscribe URL (use Apps Script URL)
    const scriptUrl = ScriptApp.getService().getUrl();
    const unsubscribeUrl = scriptUrl + '?action=unsubscribe&email=' + encodeURIComponent(data.toEmail);

    // Personalize unsubscribe link
    const personalizedHtml = data.html.replace(
      '{{unsubscribe_url}}',
      unsubscribeUrl
    );

    const options = {
      htmlBody: personalizedHtml,
      name: data.fromName || CONFIG.FROM_NAME
    };

    if (data.replyTo) {
      options.replyTo = data.replyTo;
    }

    GmailApp.sendEmail(data.toEmail, data.subject, '', options);

    // Update lastEmailedAt in Sheet if exists
    try {
      const existing = findSubscriberByEmail(data.toEmail);
      if (existing) {
        const sheet = getSubscribersSheet();
        // Add lastEmailedAt column if it doesn't exist (column 9)
        const headers = sheet.getRange(1, 1, 1, 10).getValues()[0];
        const lastEmailedIdx = headers.indexOf('lastEmailedAt');
        if (lastEmailedIdx >= 0) {
          sheet.getRange(existing.row, lastEmailedIdx + 1).setValue(new Date());
        }
      }
    } catch (e) {
      // Ignore Sheet errors, email was still sent
    }

    return createResponse(true, 'Email sent to ' + data.toEmail);
  } catch (error) {
    return createResponse(false, 'Failed to send: ' + error.message);
  }
}

/**
 * Send newsletter to multiple recipients (batch mode)
 */
function handleSendNewsletter(data) {
  if (!data.recipients || !data.html || !data.subject) {
    return createResponse(false, 'Missing required parameters (recipients, html, subject)');
  }

  if (!Array.isArray(data.recipients) || data.recipients.length === 0) {
    return createResponse(false, 'Recipients must be a non-empty array');
  }

  // Get unsubscribe base URL
  const scriptUrl = ScriptApp.getService().getUrl();

  const results = {
    total: data.recipients.length,
    sent: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < data.recipients.length; i++) {
    const email = data.recipients[i];

    try {
      // Personalize unsubscribe link for each recipient
      const unsubscribeUrl = scriptUrl + '?action=unsubscribe&email=' + encodeURIComponent(email);
      const personalizedHtml = data.html.replace(
        '{{unsubscribe_url}}',
        unsubscribeUrl
      );

      const options = {
        htmlBody: personalizedHtml,
        name: data.fromName || CONFIG.FROM_NAME
      };

      if (data.replyTo) {
        options.replyTo = data.replyTo;
      }

      GmailApp.sendEmail(email, data.subject, '', options);

      results.sent++;

      // Rate limiting between emails
      if (i < data.recipients.length - 1) {
        Utilities.sleep(CONFIG.RATE_LIMIT_DELAY);
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: email,
        error: error.message
      });
    }
  }

  return createResponse(results.sent > 0, results);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create JSON response
 */
function createResponse(success, data) {
  const response = {
    success: success,
    data: typeof data === 'string' ? { message: data } : data,
    timestamp: new Date().toISOString()
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get active subscribers for sending newsletters
 * Can be called from admin UI to get recipients
 */
function getActiveSubscribers() {
  try {
    const sheet = getSubscribersSheet();
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const statusIdx = headers.indexOf('status');
    const emailIdx = headers.indexOf('email');

    const active = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][statusIdx] === 'active' && rows[i][emailIdx]) {
        active.push(rows[i][emailIdx]);
      }
    }
    return active;
  } catch (e) {
    return [];
  }
}
