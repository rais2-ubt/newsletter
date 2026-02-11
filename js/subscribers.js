/**
 * Subscribers Module
 * Handles subscriber management
 */

const SubscriberManager = {
    /**
     * Get all subscribers
     * @returns {Array} Subscriber list
     */
    getAll() {
        const data = StorageManager.getSubscribers();
        return data.subscribers || [];
    },

    /**
     * Get active subscribers only
     * @returns {Array} Active subscriber list
     */
    getActive() {
        return StorageManager.getActiveSubscribers();
    },

    /**
     * Get subscriber count
     * @returns {Object} Counts
     */
    getCounts() {
        const all = this.getAll();
        const active = all.filter(s => s.active);
        return {
            total: all.length,
            active: active.length,
            inactive: all.length - active.length
        };
    },

    /**
     * Add a new subscriber
     * @param {string} email - Email address
     * @param {string} name - Optional name
     * @returns {Object} Result
     */
    add(email, name = null) {
        // Validate email
        if (!EmailService.isValidEmail(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        return StorageManager.addSubscriber(email, name);
    },

    /**
     * Add multiple subscribers
     * @param {Array} subscribers - Array of {email, name} objects
     * @returns {Object} Results
     */
    addBulk(subscribers) {
        const results = {
            added: 0,
            skipped: 0,
            errors: []
        };

        subscribers.forEach(sub => {
            const email = typeof sub === 'string' ? sub : sub.email;
            const name = typeof sub === 'string' ? null : sub.name;

            const result = this.add(email, name);
            if (result.success) {
                results.added++;
            } else {
                results.skipped++;
                results.errors.push({ email, error: result.error });
            }
        });

        return results;
    },

    /**
     * Remove a subscriber
     * @param {string} id - Subscriber ID
     */
    remove(id) {
        StorageManager.removeSubscriber(id);
    },

    /**
     * Update subscriber
     * @param {string} id - Subscriber ID
     * @param {Object} updates - Fields to update
     */
    update(id, updates) {
        StorageManager.updateSubscriber(id, updates);
    },

    /**
     * Toggle subscriber active status
     * @param {string} id - Subscriber ID
     */
    toggleActive(id) {
        const all = this.getAll();
        const subscriber = all.find(s => s.id === id);
        if (subscriber) {
            this.update(id, { active: !subscriber.active });
        }
    },

    /**
     * Find subscriber by email
     * @param {string} email - Email to find
     * @returns {Object|null} Subscriber or null
     */
    findByEmail(email) {
        const all = this.getAll();
        return all.find(s => s.email.toLowerCase() === email.toLowerCase()) || null;
    },

    /**
     * Search subscribers
     * @param {string} query - Search query
     * @returns {Array} Matching subscribers
     */
    search(query) {
        const all = this.getAll();
        const lower = query.toLowerCase();
        return all.filter(s =>
            s.email.toLowerCase().includes(lower) ||
            (s.name && s.name.toLowerCase().includes(lower))
        );
    },

    /**
     * Import from CSV string
     * @param {string} csv - CSV content
     * @returns {Object} Import results
     */
    importCSV(csv) {
        const lines = csv.split('\n').map(line => line.trim()).filter(line => line);
        const subscribers = [];

        lines.forEach((line, index) => {
            // Skip header row if detected
            if (index === 0 && (line.toLowerCase().includes('email') || line.toLowerCase().includes('name'))) {
                return;
            }

            const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
            if (parts.length > 0 && parts[0]) {
                subscribers.push({
                    email: parts[0],
                    name: parts[1] || null
                });
            }
        });

        return this.addBulk(subscribers);
    },

    /**
     * Export to CSV string
     * @param {boolean} activeOnly - Only export active subscribers
     * @returns {string} CSV content
     */
    exportCSV(activeOnly = false) {
        const subscribers = activeOnly ? this.getActive() : this.getAll();
        const lines = ['email,name,active,added_at'];

        subscribers.forEach(s => {
            lines.push(`"${s.email}","${s.name || ''}","${s.active}","${s.addedAt}"`);
        });

        return lines.join('\n');
    },

    /**
     * Download subscribers as CSV
     * @param {boolean} activeOnly - Only export active
     */
    downloadCSV(activeOnly = false) {
        const csv = this.exportCSV(activeOnly);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Clear all subscribers
     */
    clearAll() {
        StorageManager.setSubscribers([]);
    },

    /**
     * Get recently added subscribers
     * @param {number} limit - Max count
     * @returns {Array} Recent subscribers
     */
    getRecent(limit = 5) {
        const all = this.getAll();
        return all
            .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
            .slice(0, limit);
    },

    /**
     * Validate subscriber list
     * @returns {Object} Validation results
     */
    validate() {
        const all = this.getAll();
        const invalid = [];
        const duplicates = [];
        const seen = new Set();

        all.forEach(s => {
            if (!EmailService.isValidEmail(s.email)) {
                invalid.push(s);
            }

            const lower = s.email.toLowerCase();
            if (seen.has(lower)) {
                duplicates.push(s);
            }
            seen.add(lower);
        });

        return {
            valid: invalid.length === 0 && duplicates.length === 0,
            invalid,
            duplicates,
            total: all.length
        };
    },

    /**
     * Remove duplicates
     * @returns {number} Number of duplicates removed
     */
    removeDuplicates() {
        const all = this.getAll();
        const seen = new Set();
        const unique = [];

        all.forEach(s => {
            const lower = s.email.toLowerCase();
            if (!seen.has(lower)) {
                seen.add(lower);
                unique.push(s);
            }
        });

        const removed = all.length - unique.length;
        if (removed > 0) {
            StorageManager.setSubscribers(unique);
        }

        return removed;
    },

    // ===== Cloud Sync (Google Sheets) =====

    /**
     * Check if Sheets sync is enabled
     * @returns {boolean} Whether sync is enabled
     */
    isSheetsEnabled() {
        return StorageManager.isSheetsEnabled();
    },

    /**
     * Fetch subscribers from Google Sheets
     * @returns {Promise<Object>} Result with subscribers
     */
    async fetchFromSheets() {
        if (!this.isSheetsEnabled()) {
            return { success: false, error: 'Sheets sync not enabled' };
        }

        StorageManager.setSyncStatus({ status: 'syncing' });

        try {
            const result = await EmailService.callAppsScript({
                action: 'getSubscribers'
            });

            if (result.success && result.data?.subscribers) {
                this.mergeFromCloud(result.data.subscribers);
                StorageManager.setSyncStatus({
                    status: 'success',
                    lastSync: new Date().toISOString(),
                    error: null
                });
            } else {
                StorageManager.setSyncStatus({
                    status: 'error',
                    error: result.data?.message || 'Failed to fetch subscribers'
                });
            }

            return result;
        } catch (error) {
            StorageManager.setSyncStatus({
                status: 'error',
                error: error.message
            });
            return { success: false, error: error.message };
        }
    },

    /**
     * Sync local subscribers to Google Sheets
     * @returns {Promise<Object>} Sync result
     */
    async syncToSheets() {
        if (!this.isSheetsEnabled()) {
            return { success: false, error: 'Sheets sync not enabled' };
        }

        StorageManager.setSyncStatus({ status: 'syncing' });

        try {
            const subscribers = this.getAll();
            const result = await EmailService.callAppsScript({
                action: 'syncSubscribers',
                subscribers: subscribers
            });

            if (result.success) {
                StorageManager.setSyncStatus({
                    status: 'success',
                    lastSync: new Date().toISOString(),
                    pendingChanges: false,
                    error: null
                });
            } else {
                StorageManager.setSyncStatus({
                    status: 'error',
                    error: result.data?.message || 'Sync failed'
                });
            }

            return result;
        } catch (error) {
            StorageManager.setSyncStatus({
                status: 'error',
                error: error.message
            });
            return { success: false, error: error.message };
        }
    },

    /**
     * Add subscriber with cloud sync
     * @param {string} email - Email address
     * @param {string} name - Optional name
     * @param {string} source - Source of subscription
     * @returns {Promise<Object>} Result
     */
    async addWithSync(email, name = null, source = 'admin') {
        // Add locally first
        const localResult = this.add(email, name);

        if (!localResult.success) {
            return localResult;
        }

        // Sync to cloud if enabled
        if (this.isSheetsEnabled()) {
            try {
                await EmailService.callAppsScript({
                    action: 'addSubscriber',
                    email: email,
                    name: name,
                    source: source
                });
            } catch (e) {
                console.warn('Cloud sync failed:', e);
                StorageManager.setSyncStatus({ pendingChanges: true });
            }
        }

        return localResult;
    },

    /**
     * Remove subscriber with cloud sync
     * @param {string} id - Subscriber ID
     * @returns {Promise<void>}
     */
    async removeWithSync(id) {
        const subscriber = this.getAll().find(s => s.id === id);

        // Remove locally
        this.remove(id);

        // Sync to cloud if enabled
        if (this.isSheetsEnabled() && subscriber) {
            try {
                await EmailService.callAppsScript({
                    action: 'removeSubscriber',
                    email: subscriber.email
                });
            } catch (e) {
                console.warn('Cloud sync failed:', e);
                StorageManager.setSyncStatus({ pendingChanges: true });
            }
        }
    },

    /**
     * Update subscriber with cloud sync
     * @param {string} id - Subscriber ID
     * @param {Object} updates - Updates to apply
     * @returns {Promise<void>}
     */
    async updateWithSync(id, updates) {
        const subscriber = this.getAll().find(s => s.id === id);

        // Update locally
        this.update(id, updates);

        // Sync to cloud if enabled
        if (this.isSheetsEnabled() && subscriber) {
            try {
                await EmailService.callAppsScript({
                    action: 'updateSubscriber',
                    email: subscriber.email,
                    name: updates.name,
                    status: updates.active === false ? 'unsubscribed' : 'active'
                });
            } catch (e) {
                console.warn('Cloud sync failed:', e);
                StorageManager.setSyncStatus({ pendingChanges: true });
            }
        }
    },

    /**
     * Merge cloud data with local subscribers
     * @param {Array} cloudSubscribers - Subscribers from cloud
     */
    mergeFromCloud(cloudSubscribers) {
        const local = this.getAll();
        const merged = [];
        const processedEmails = new Set();

        // Process cloud subscribers (they are authoritative)
        cloudSubscribers.forEach(cloudSub => {
            if (!cloudSub.email) return;

            const email = cloudSub.email.toLowerCase();
            processedEmails.add(email);

            const localMatch = local.find(l =>
                l.email.toLowerCase() === email
            );

            if (localMatch) {
                // Merge: cloud status is authoritative
                merged.push({
                    id: localMatch.id,
                    email: cloudSub.email,
                    name: cloudSub.name || localMatch.name,
                    active: cloudSub.status !== 'unsubscribed',
                    addedAt: cloudSub.subscribedAt || localMatch.addedAt
                });
            } else {
                // New from cloud
                merged.push({
                    id: cloudSub.id || StorageManager.generateId(),
                    email: cloudSub.email,
                    name: cloudSub.name || null,
                    active: cloudSub.status !== 'unsubscribed',
                    addedAt: cloudSub.subscribedAt || new Date().toISOString()
                });
            }
        });

        // Keep local-only subscribers (not in cloud yet)
        local.forEach(localSub => {
            const email = localSub.email.toLowerCase();
            if (!processedEmails.has(email)) {
                merged.push(localSub);
            }
        });

        StorageManager.setSubscribers(merged);
    }
};

// Export for use in other modules
window.SubscriberManager = SubscriberManager;
