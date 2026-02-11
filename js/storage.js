/**
 * Storage Module
 * Handles all localStorage operations for the RAIS2 Newsletter static site
 */

const StorageManager = {
    // Storage Keys
    KEYS: {
        EMAIL_SETTINGS: 'rais2_email_settings',
        SUBSCRIBERS: 'rais2_subscribers',
        SEEN_ITEMS: 'rais2_seen_items',
        CACHED_CONTENT: 'rais2_cached_content',
        NEWSLETTERS: 'rais2_newsletters',
        APP_SETTINGS: 'rais2_app_settings',
        SHEETS_CONFIG: 'rais2_sheets_config',
        SYNC_STATUS: 'rais2_sync_status',
        // New keys for enhanced builder
        NEWSLETTER_ORDER: 'rais2_newsletter_order',
        CUSTOM_BLOCKS: 'rais2_custom_blocks',
        CUSTOM_DESCRIPTIONS: 'rais2_custom_descriptions',
        AI_CHAT_HISTORY: 'rais2_ai_chat_history',
        AI_SETTINGS: 'rais2_ai_settings',
        // CMS Export keys
        CMS_SETTINGS: 'rais2_cms_settings',
        FORMS_CONFIG: 'rais2_forms_config',
        // Custom Items
        CUSTOM_ITEMS: 'rais2_custom_items',
        // CSV Items
        CSV_ITEMS: 'rais2_csv_items',
        // Newsletter Settings (logo, dividers, etc.)
        NEWSLETTER_SETTINGS: 'rais2_newsletter_settings'
    },

    // Default values
    DEFAULTS: {
        EMAIL_SETTINGS: {
            configured: false,
            appsScriptUrl: '',
            fromName: 'RAIS2 Newsletter',
            replyTo: '',
            lastTested: null
        },
        SUBSCRIBERS: {
            subscribers: [],
            lastModified: null
        },
        SEEN_ITEMS: {
            items: {},
            lastCheck: null
        },
        CACHED_CONTENT: {
            news: [],
            events: [],
            lectures: [],
            publications: [],
            members: [],
            projects: [],
            cachedAt: null,
            expiresAt: null
        },
        NEWSLETTERS: {
            newsletters: []
        },
        APP_SETTINGS: {
            theme: 'auto',
            cacheExpiry: 24, // hours
            preferredProxy: 0,
            lastVersion: '1.0.0'
        },
        SHEETS_CONFIG: {
            enabled: false,
            lastSync: null,
            autoSync: true
        },
        SYNC_STATUS: {
            status: 'idle', // idle, syncing, success, error
            lastSync: null,
            pendingChanges: false,
            error: null
        },
        // New defaults for enhanced builder
        NEWSLETTER_ORDER: {
            sectionOrder: ['news', 'event', 'lecture', 'publication', 'member', 'project'],
            itemOrder: {},
            savedAt: null
        },
        CUSTOM_BLOCKS: {
            blocks: [],
            savedAt: null
        },
        CUSTOM_DESCRIPTIONS: {
            descriptions: {},
            savedAt: null
        },
        AI_CHAT_HISTORY: {
            messages: [],
            savedAt: null
        },
        AI_SETTINGS: {
            provider: 'openrouter', // 'openrouter' (free models), 'puter', 'openai', 'claude'
            apiKey: '',
            model: 'meta-llama/llama-4-maverick:free', // Best free model on OpenRouter (Llama 4 400B MoE)
            systemPrompt: `You are an AI assistant for the RAIS² Newsletter builder at the University of Bayreuth.
You help create professional, engaging content for academic newsletters about AI research.

Guidelines:
- Keep tone professional but accessible
- Match UBT corporate communication style
- Be concise for newsletter content (2-3 sentences max for descriptions)
- Focus on AI research and academic events
- Use active voice
- Avoid jargon unless necessary

When writing newsletter content:
- Intros should be welcoming and highlight key updates
- Event descriptions should include what, when, and why it matters
- Keep summaries scannable and informative`,
            configured: false
        },
        // CMS Export defaults
        CMS_SETTINGS: {
            defaultContentType: 'event',
            pathBase: '/de/Uni_Bayreuth/Forschungseinrichtungen_2016/RAIS2/en/',
            lastExport: null,
            savedMappings: {}
        },
        FORMS_CONFIG: {
            sheetsApiKey: '',
            sheetsId: '',
            sheetName: '',
            autoSync: false,
            lastSync: null,
            fieldMappings: {
                title: 'title',
                summary: 'summary',
                date: 'date',
                url: 'url',
                speaker: 'speaker',
                location: 'location',
                time: 'time',
                image: 'image'
            }
        },
        // Custom Items for user-created content
        CUSTOM_ITEMS: {
            items: [],
            savedAt: null
        },
        // CSV Items for imported CSV data
        CSV_ITEMS: {
            items: [],
            savedAt: null
        },
        // Newsletter rendering settings
        NEWSLETTER_SETTINGS: {
            showLogo: true,
            logoUrl: 'assets/rais2_logo.jpeg',
            dividerStyle: 'gradient', // solid, gradient, dots, wave
            featuredItemId: null,
            savedAt: null
        }
    },

    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed data or default value
     */
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error(`Error reading from localStorage (${key}):`, e);
            return defaultValue;
        }
    },

    /**
     * Set data in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            this.dispatchChange(key, value);
        } catch (e) {
            console.error(`Error writing to localStorage (${key}):`, e);
            // Handle quota exceeded
            if (e.name === 'QuotaExceededError') {
                this.handleQuotaExceeded();
            }
        }
    },

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            this.dispatchChange(key, null);
        } catch (e) {
            console.error(`Error removing from localStorage (${key}):`, e);
        }
    },

    /**
     * Dispatch storage change event
     * @param {string} key - Changed key
     * @param {*} value - New value
     */
    dispatchChange(key, value) {
        window.dispatchEvent(new CustomEvent('storageChange', {
            detail: { key, value }
        }));
    },

    /**
     * Handle quota exceeded error
     */
    handleQuotaExceeded() {
        // Clear cached content first (largest likely data)
        this.remove(this.KEYS.CACHED_CONTENT);
        console.warn('Storage quota exceeded. Cleared cached content.');
    },

    // ===== Email Settings =====

    getEmailSettings() {
        return this.get(this.KEYS.EMAIL_SETTINGS, this.DEFAULTS.EMAIL_SETTINGS);
    },

    setEmailSettings(settings) {
        const current = this.getEmailSettings();
        this.set(this.KEYS.EMAIL_SETTINGS, { ...current, ...settings });
    },

    isEmailConfigured() {
        const settings = this.getEmailSettings();
        return settings.configured && settings.appsScriptUrl;
    },

    // ===== Subscribers =====

    getSubscribers() {
        return this.get(this.KEYS.SUBSCRIBERS, this.DEFAULTS.SUBSCRIBERS);
    },

    setSubscribers(subscribers) {
        this.set(this.KEYS.SUBSCRIBERS, {
            subscribers,
            lastModified: new Date().toISOString()
        });
    },

    addSubscriber(email, name = null) {
        const data = this.getSubscribers();
        const id = this.generateId();

        // Check for duplicate
        if (data.subscribers.some(s => s.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, error: 'Email already exists' };
        }

        data.subscribers.push({
            id,
            email: email.toLowerCase(),
            name,
            addedAt: new Date().toISOString(),
            active: true
        });

        this.setSubscribers(data.subscribers);
        return { success: true, id };
    },

    removeSubscriber(id) {
        const data = this.getSubscribers();
        data.subscribers = data.subscribers.filter(s => s.id !== id);
        this.setSubscribers(data.subscribers);
    },

    updateSubscriber(id, updates) {
        const data = this.getSubscribers();
        const index = data.subscribers.findIndex(s => s.id === id);
        if (index !== -1) {
            data.subscribers[index] = { ...data.subscribers[index], ...updates };
            this.setSubscribers(data.subscribers);
        }
    },

    getActiveSubscribers() {
        const data = this.getSubscribers();
        return data.subscribers.filter(s => s.active);
    },

    // ===== Seen Items (Tracker) =====

    getSeenItems() {
        return this.get(this.KEYS.SEEN_ITEMS, this.DEFAULTS.SEEN_ITEMS);
    },

    isItemSeen(itemId) {
        const data = this.getSeenItems();
        return itemId in data.items;
    },

    markItemsSeen(items) {
        const data = this.getSeenItems();
        items.forEach(item => {
            data.items[item.id] = {
                title: item.title,
                date: item.date,
                seenAt: new Date().toISOString()
            };
        });
        data.lastCheck = new Date().toISOString();
        this.set(this.KEYS.SEEN_ITEMS, data);
    },

    clearSeenItems() {
        this.set(this.KEYS.SEEN_ITEMS, this.DEFAULTS.SEEN_ITEMS);
    },

    // ===== Cached Content =====

    getCachedContent() {
        return this.get(this.KEYS.CACHED_CONTENT, this.DEFAULTS.CACHED_CONTENT);
    },

    setCachedContent(content) {
        const settings = this.getAppSettings();
        const expiryHours = settings.cacheExpiry || 24;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiryHours);

        this.set(this.KEYS.CACHED_CONTENT, {
            ...content,
            cachedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString()
        });
    },

    isCacheValid() {
        const data = this.getCachedContent();
        if (!data.expiresAt) return false;
        return new Date(data.expiresAt) > new Date();
    },

    clearCache() {
        this.set(this.KEYS.CACHED_CONTENT, this.DEFAULTS.CACHED_CONTENT);
    },

    // ===== Newsletters =====

    getNewsletters() {
        return this.get(this.KEYS.NEWSLETTERS, this.DEFAULTS.NEWSLETTERS);
    },

    saveNewsletter(newsletter) {
        const data = this.getNewsletters();
        const id = this.generateId();

        data.newsletters.unshift({
            id,
            title: newsletter.title || `Newsletter - ${new Date().toLocaleDateString()}`,
            createdAt: new Date().toISOString(),
            sentAt: null,
            recipientCount: 0,
            html: newsletter.html,
            items: newsletter.items || []
        });

        this.set(this.KEYS.NEWSLETTERS, data);
        return id;
    },

    getNewsletter(id) {
        const data = this.getNewsletters();
        return data.newsletters.find(n => n.id === id);
    },

    updateNewsletter(id, updates) {
        const data = this.getNewsletters();
        const index = data.newsletters.findIndex(n => n.id === id);
        if (index !== -1) {
            data.newsletters[index] = { ...data.newsletters[index], ...updates };
            this.set(this.KEYS.NEWSLETTERS, data);
        }
    },

    deleteNewsletter(id) {
        const data = this.getNewsletters();
        data.newsletters = data.newsletters.filter(n => n.id !== id);
        this.set(this.KEYS.NEWSLETTERS, data);
    },

    // ===== App Settings =====

    getAppSettings() {
        return this.get(this.KEYS.APP_SETTINGS, this.DEFAULTS.APP_SETTINGS);
    },

    setAppSettings(settings) {
        const current = this.getAppSettings();
        this.set(this.KEYS.APP_SETTINGS, { ...current, ...settings });
    },

    // ===== Sheets Config =====

    getSheetsConfig() {
        return this.get(this.KEYS.SHEETS_CONFIG, this.DEFAULTS.SHEETS_CONFIG);
    },

    setSheetsConfig(config) {
        const current = this.getSheetsConfig();
        this.set(this.KEYS.SHEETS_CONFIG, { ...current, ...config });
    },

    isSheetsEnabled() {
        const config = this.getSheetsConfig();
        const emailSettings = this.getEmailSettings();
        return config.enabled && emailSettings.configured && emailSettings.appsScriptUrl;
    },

    // ===== Sync Status =====

    getSyncStatus() {
        return this.get(this.KEYS.SYNC_STATUS, this.DEFAULTS.SYNC_STATUS);
    },

    setSyncStatus(status) {
        const current = this.getSyncStatus();
        this.set(this.KEYS.SYNC_STATUS, { ...current, ...status });
    },

    // ===== Newsletter Order =====

    getNewsletterOrder() {
        return this.get(this.KEYS.NEWSLETTER_ORDER, this.DEFAULTS.NEWSLETTER_ORDER);
    },

    setNewsletterOrder(order) {
        this.set(this.KEYS.NEWSLETTER_ORDER, {
            ...order,
            savedAt: new Date().toISOString()
        });
    },

    // ===== Custom Blocks =====

    getCustomBlocks() {
        return this.get(this.KEYS.CUSTOM_BLOCKS, this.DEFAULTS.CUSTOM_BLOCKS);
    },

    setCustomBlocks(blocks) {
        this.set(this.KEYS.CUSTOM_BLOCKS, {
            blocks,
            savedAt: new Date().toISOString()
        });
    },

    // ===== Custom Descriptions =====

    getCustomDescriptions() {
        return this.get(this.KEYS.CUSTOM_DESCRIPTIONS, this.DEFAULTS.CUSTOM_DESCRIPTIONS);
    },

    setCustomDescription(itemId, description) {
        const data = this.getCustomDescriptions();
        data.descriptions[itemId] = description;
        data.savedAt = new Date().toISOString();
        this.set(this.KEYS.CUSTOM_DESCRIPTIONS, data);
    },

    getCustomDescription(itemId) {
        const data = this.getCustomDescriptions();
        return data.descriptions[itemId] || null;
    },

    clearCustomDescriptions() {
        this.set(this.KEYS.CUSTOM_DESCRIPTIONS, this.DEFAULTS.CUSTOM_DESCRIPTIONS);
    },

    // ===== AI Settings =====

    getAISettings() {
        return this.get(this.KEYS.AI_SETTINGS, this.DEFAULTS.AI_SETTINGS);
    },

    setAISettings(settings) {
        const current = this.getAISettings();
        this.set(this.KEYS.AI_SETTINGS, { ...current, ...settings });
    },

    isAIConfigured() {
        const settings = this.getAISettings();
        // Puter.js doesn't need API key, so it's always "configured"
        if (settings.provider === 'puter') {
            return true;
        }
        // OpenRouter free models work without API key
        if (settings.provider === 'openrouter' && settings.model?.includes(':free')) {
            return true;
        }
        return settings.configured && settings.apiKey;
    },

    // ===== CMS Settings =====

    getCMSSettings() {
        return this.get(this.KEYS.CMS_SETTINGS, this.DEFAULTS.CMS_SETTINGS);
    },

    setCMSSettings(settings) {
        const current = this.getCMSSettings();
        this.set(this.KEYS.CMS_SETTINGS, { ...current, ...settings });
    },

    // ===== Forms Config =====

    getFormsConfig() {
        return this.get(this.KEYS.FORMS_CONFIG, this.DEFAULTS.FORMS_CONFIG);
    },

    setFormsConfig(config) {
        const current = this.getFormsConfig();
        this.set(this.KEYS.FORMS_CONFIG, { ...current, ...config });
    },

    getFieldMappings() {
        const config = this.getFormsConfig();
        return config.fieldMappings || this.DEFAULTS.FORMS_CONFIG.fieldMappings;
    },

    setFieldMappings(mappings) {
        const config = this.getFormsConfig();
        config.fieldMappings = { ...config.fieldMappings, ...mappings };
        this.set(this.KEYS.FORMS_CONFIG, config);
    },

    // ===== Custom Items =====

    getCustomItems() {
        return this.get(this.KEYS.CUSTOM_ITEMS, this.DEFAULTS.CUSTOM_ITEMS);
    },

    setCustomItems(items) {
        this.set(this.KEYS.CUSTOM_ITEMS, {
            items,
            savedAt: new Date().toISOString()
        });
    },

    addCustomItem(item) {
        const data = this.getCustomItems();
        const id = 'custom-' + this.generateId();
        const newItem = {
            id,
            ...item,
            isCustom: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.items.push(newItem);
        this.setCustomItems(data.items);
        return newItem;
    },

    updateCustomItem(itemId, updates) {
        const data = this.getCustomItems();
        const index = data.items.findIndex(i => i.id === itemId);
        if (index !== -1) {
            data.items[index] = {
                ...data.items[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.setCustomItems(data.items);
            return data.items[index];
        }
        return null;
    },

    deleteCustomItem(itemId) {
        const data = this.getCustomItems();
        data.items = data.items.filter(i => i.id !== itemId);
        this.setCustomItems(data.items);
    },

    getCustomItemsByCategory(category) {
        const data = this.getCustomItems();
        return data.items.filter(i => i.category === category);
    },

    // ===== CSV Items =====

    getCSVItems() {
        return this.get(this.KEYS.CSV_ITEMS, this.DEFAULTS.CSV_ITEMS);
    },

    setCSVItems(items) {
        this.set(this.KEYS.CSV_ITEMS, {
            items,
            savedAt: new Date().toISOString()
        });
    },

    addCSVItem(item) {
        const data = this.getCSVItems();
        const id = 'csv-' + this.generateId();
        const newItem = {
            id,
            ...item,
            isCSV: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        data.items.push(newItem);
        this.setCSVItems(data.items);
        return newItem;
    },

    addCSVItems(items) {
        const data = this.getCSVItems();
        const newItems = items.map(item => ({
            id: 'csv-' + this.generateId() + Math.random().toString(36).substr(2, 4),
            ...item,
            isCSV: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));
        data.items.push(...newItems);
        this.setCSVItems(data.items);
        return newItems;
    },

    deleteCSVItem(itemId) {
        const data = this.getCSVItems();
        data.items = data.items.filter(i => i.id !== itemId);
        this.setCSVItems(data.items);
    },

    updateCSVItem(itemId, updates) {
        const data = this.getCSVItems();
        const index = data.items.findIndex(i => i.id === itemId);
        if (index !== -1) {
            data.items[index] = { ...data.items[index], ...updates, updatedAt: new Date().toISOString() };
            this.setCSVItems(data.items);
            return data.items[index];
        }
        return null;
    },

    clearCSVItems() {
        this.setCSVItems([]);
    },

    getCSVItemsByCategory(category) {
        const data = this.getCSVItems();
        return data.items.filter(i => i.category === category);
    },

    // ===== Newsletter Settings =====

    getNewsletterSettings() {
        return this.get(this.KEYS.NEWSLETTER_SETTINGS, this.DEFAULTS.NEWSLETTER_SETTINGS);
    },

    setNewsletterSettings(settings) {
        const current = this.getNewsletterSettings();
        this.set(this.KEYS.NEWSLETTER_SETTINGS, {
            ...current,
            ...settings,
            savedAt: new Date().toISOString()
        });
    },

    // ===== Export/Import =====

    exportAll() {
        const data = {};
        Object.values(this.KEYS).forEach(key => {
            data[key] = this.get(key);
        });
        return {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            data
        };
    },

    importAll(exportData) {
        try {
            if (!exportData.data) {
                throw new Error('Invalid export data format');
            }

            Object.entries(exportData.data).forEach(([key, value]) => {
                if (Object.values(this.KEYS).includes(key) && value) {
                    this.set(key, value);
                }
            });

            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    // ===== Utilities =====

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    getStorageSize() {
        let total = 0;
        Object.values(this.KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                total += item.length * 2; // UTF-16 = 2 bytes per char
            }
        });
        return total;
    },

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            this.remove(key);
        });
    }
};

// Export for use in other modules
window.StorageManager = StorageManager;
