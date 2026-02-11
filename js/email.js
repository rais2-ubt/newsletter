/**
 * Email Module
 * Handles email sending via Google Apps Script
 */

const EmailService = {
    /**
     * Check if email service is configured
     * @returns {boolean} Configuration status
     */
    isConfigured() {
        return StorageManager.isEmailConfigured();
    },

    /**
     * Get email settings
     * @returns {Object} Email settings
     */
    getSettings() {
        return StorageManager.getEmailSettings();
    },

    /**
     * Save email settings
     * @param {Object} settings - Settings to save
     */
    saveSettings(settings) {
        StorageManager.setEmailSettings({
            ...settings,
            configured: true
        });
    },

    /**
     * Call Apps Script endpoint with response
     * @param {Object} payload - Request payload
     * @returns {Promise<Object>} Response from Apps Script
     */
    async callAppsScript(payload) {
        const settings = this.getSettings();

        if (!settings.appsScriptUrl) {
            throw new Error('Apps Script URL not configured');
        }

        try {
            const response = await fetch(settings.appsScriptUrl, {
                method: 'POST',
                redirect: 'follow',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    ...payload,
                    fromName: settings.fromName || 'RAIS2 Newsletter',
                    replyTo: settings.replyTo || ''
                })
            });

            const text = await response.text();
            return JSON.parse(text);
        } catch (error) {
            console.error('Apps Script call failed:', error);
            throw error;
        }
    },

    /**
     * Test connection to Apps Script
     * @returns {Promise<Object>} Connection test result
     */
    async testConnection() {
        try {
            const settings = this.getSettings();
            if (!settings.appsScriptUrl) {
                return { success: false, error: 'Apps Script URL not configured' };
            }

            const response = await fetch(settings.appsScriptUrl);
            const data = await response.json();

            return {
                success: data.status === 'ok',
                message: data.message,
                version: data.version
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Send a test email
     * @param {string} toEmail - Test recipient email
     * @returns {Promise<Object>} Result object
     */
    async sendTestEmail(toEmail) {
        try {
            const settings = this.getSettings();
            if (!settings.configured) {
                return { success: false, error: 'Email service not configured' };
            }

            const result = await this.callAppsScript({
                action: 'test',
                toEmail: toEmail
            });

            if (result.success) {
                // Update last tested time
                StorageManager.setEmailSettings({ lastTested: new Date().toISOString() });
            }

            return result;
        } catch (error) {
            console.error('Test email failed:', error);
            return { success: false, error: error.message || 'Failed to send test email' };
        }
    },

    /**
     * Send newsletter to a single recipient
     * @param {string} toEmail - Recipient email
     * @param {string} html - Newsletter HTML
     * @param {string} subject - Email subject
     * @returns {Promise<Object>} Result object
     */
    async sendToRecipient(toEmail, html, subject) {
        try {
            const settings = this.getSettings();
            if (!settings.configured) {
                return { success: false, error: 'Email service not configured' };
            }

            const result = await this.callAppsScript({
                action: 'sendSingle',
                toEmail: toEmail,
                html: html,
                subject: subject
            });

            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Send newsletter to all subscribers
     * @param {string} html - Newsletter HTML
     * @param {string} subject - Email subject
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} Result object
     */
    async sendNewsletter(html, subject = null, onProgress = null) {
        try {
            const settings = this.getSettings();
            if (!settings.configured) {
                return { success: false, error: 'Email service not configured' };
            }

            const subscribers = StorageManager.getActiveSubscribers();
            if (subscribers.length === 0) {
                return { success: false, error: 'No active subscribers' };
            }

            const emailSubject = subject ||
                `RAIS2 Newsletter - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

            const results = {
                total: subscribers.length,
                sent: 0,
                failed: 0,
                errors: []
            };

            // Send emails one by one with progress tracking
            for (let i = 0; i < subscribers.length; i++) {
                const subscriber = subscribers[i];
                const result = await this.sendToRecipient(subscriber.email, html, emailSubject);

                if (result.success) {
                    results.sent++;
                } else {
                    results.failed++;
                    results.errors.push({
                        email: subscriber.email,
                        error: result.error || result.data?.message || 'Unknown error'
                    });
                }

                // Call progress callback
                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total: subscribers.length,
                        email: subscriber.email,
                        success: result.success
                    });
                }

                // Rate limiting - wait between emails
                if (i < subscribers.length - 1) {
                    await this.delay(1000);
                }
            }

            return {
                success: results.sent > 0,
                ...results
            };
        } catch (error) {
            console.error('Send newsletter failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send newsletter in batch mode (all at once to Apps Script)
     * More efficient but no real-time progress tracking
     * @param {string} html - Newsletter HTML
     * @param {string} subject - Email subject
     * @returns {Promise<Object>} Result object
     */
    async sendNewsletterBatch(html, subject = null) {
        try {
            const settings = this.getSettings();
            if (!settings.configured) {
                return { success: false, error: 'Email service not configured' };
            }

            const subscribers = StorageManager.getActiveSubscribers();
            if (subscribers.length === 0) {
                return { success: false, error: 'No active subscribers' };
            }

            const emailSubject = subject ||
                `RAIS2 Newsletter - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

            const result = await this.callAppsScript({
                action: 'send',
                recipients: subscribers.map(s => s.email),
                html: html,
                subject: emailSubject
            });

            return result.data || result;
        } catch (error) {
            console.error('Send newsletter batch failed:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Validate email address format
     * @param {string} email - Email to validate
     * @returns {boolean} Validity
     */
    isValidEmail(email) {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    },

    /**
     * Get setup instructions
     * @returns {Object} Setup instructions
     */
    getSetupInstructions() {
        return {
            steps: [
                {
                    title: '1. Open Google Apps Script',
                    description: 'Go to script.google.com and create a new project.',
                    link: 'https://script.google.com/'
                },
                {
                    title: '2. Add the Email Script',
                    description: 'Copy the Apps Script code from the docs folder into Code.gs'
                },
                {
                    title: '3. Deploy as Web App',
                    description: 'Click Deploy > New deployment > Web app. Set "Execute as" to "Me" and "Who has access" to "Anyone".'
                },
                {
                    title: '4. Authorize the App',
                    description: 'Click "Authorize access" and allow Gmail permissions when prompted.'
                },
                {
                    title: '5. Copy the Web App URL',
                    description: 'Copy the URL from the deployment confirmation (starts with https://script.google.com/macros/s/...)'
                },
                {
                    title: '6. Configure Here',
                    description: 'Paste the Web App URL in the settings form below.'
                }
            ],
            notes: [
                'Gmail sending limits: 500 emails/day (regular) or 1,500/day (Workspace)',
                'Your Apps Script URL is stored locally in your browser',
                'The script runs with your Google account permissions',
                'Emails will be sent from your Gmail account'
            ]
        };
    }
};

// Export for use in other modules
window.EmailService = EmailService;
