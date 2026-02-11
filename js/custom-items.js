/**
 * Custom Items Manager Module
 * Allows users to create custom content items (events, news, announcements)
 * that are not scraped from the website.
 */

const CustomItemManager = {
    // Item types that can be created
    ITEM_TYPES: {
        EVENT: 'event',
        NEWS: 'news',
        ANNOUNCEMENT: 'announcement',
        HIGHLIGHT: 'highlight'
    },

    // Category mappings for display
    CATEGORY_MAP: {
        event: { label: 'Event', icon: 'calendar' },
        news: { label: 'News', icon: 'newspaper' },
        announcement: { label: 'Announcement', icon: 'megaphone' },
        highlight: { label: 'Highlight', icon: 'star' }
    },

    // Callback for changes
    onChange: null,

    /**
     * Initialize the custom item manager
     */
    init(options = {}) {
        this.onChange = options.onChange || null;
    },

    /**
     * Create a new custom item
     * @param {string} type - Item type (event, news, announcement, highlight)
     * @param {Object} data - Item data
     * @returns {Object} Created item
     */
    createItem(type, data) {
        const item = {
            category: type === 'announcement' || type === 'highlight' ? 'news' : type,
            itemType: type,
            title: data.title || '',
            summary: data.summary || data.description || '',
            date: data.date || new Date().toLocaleDateString('de-DE'),
            url: data.url || '#',
            isCustom: true,
            // Event-specific fields
            ...(type === 'event' && {
                time: data.time || '',
                location: data.location || '',
                speaker: data.speaker || ''
            }),
            // Announcement/highlight specific
            ...(type === 'announcement' && {
                isAnnouncement: true
            }),
            ...(type === 'highlight' && {
                isHighlight: true,
                highlightStyle: data.highlightStyle || 'default'
            })
        };

        const savedItem = StorageManager.addCustomItem(item);
        this.notifyChange();
        return savedItem;
    },

    /**
     * Update an existing custom item
     * @param {string} itemId - Item ID
     * @param {Object} updates - Updates to apply
     * @returns {Object|null} Updated item or null
     */
    updateItem(itemId, updates) {
        const updatedItem = StorageManager.updateCustomItem(itemId, updates);
        if (updatedItem) {
            this.notifyChange();
        }
        return updatedItem;
    },

    /**
     * Delete a custom item
     * @param {string} itemId - Item ID
     */
    deleteItem(itemId) {
        StorageManager.deleteCustomItem(itemId);
        this.notifyChange();
    },

    /**
     * Get all custom items
     * @returns {Array} All custom items
     */
    getAllItems() {
        const data = StorageManager.getCustomItems();
        return data.items || [];
    },

    /**
     * Get custom items by category
     * @param {string} category - Category to filter
     * @returns {Array} Filtered items
     */
    getItemsByCategory(category) {
        return this.getAllItems().filter(item => item.category === category);
    },

    /**
     * Get a single custom item by ID
     * @param {string} itemId - Item ID
     * @returns {Object|null} Item or null
     */
    getItem(itemId) {
        return this.getAllItems().find(item => item.id === itemId) || null;
    },

    /**
     * Merge custom items with scraped items
     * @param {Array} scrapedItems - Items from the scraper
     * @returns {Array} Merged and sorted items
     */
    mergeWithScraped(scrapedItems) {
        const customItems = this.getAllItems();
        const allItems = [...scrapedItems, ...customItems];

        // Sort by date (most recent first)
        return allItems.sort((a, b) => {
            const dateA = this.parseDate(a.date);
            const dateB = this.parseDate(b.date);
            return dateB - dateA;
        });
    },

    /**
     * Parse date string (DD.MM.YYYY) to Date object
     * @param {string} dateStr - Date string
     * @returns {Date} Date object
     */
    parseDate(dateStr) {
        if (!dateStr) return new Date(0);
        const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (match) {
            const [, day, month, year] = match;
            return new Date(year, month - 1, day);
        }
        return new Date(dateStr) || new Date(0);
    },

    /**
     * Format today's date in DD.MM.YYYY format
     * @returns {string} Formatted date
     */
    getTodayFormatted() {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        return `${day}.${month}.${year}`;
    },

    /**
     * Get default data for a new item
     * @param {string} type - Item type
     * @returns {Object} Default data
     */
    getDefaultData(type) {
        const base = {
            title: '',
            summary: '',
            date: this.getTodayFormatted(),
            url: ''
        };

        switch (type) {
            case 'event':
                return {
                    ...base,
                    time: '',
                    location: '',
                    speaker: ''
                };
            case 'announcement':
                return {
                    ...base,
                    isAnnouncement: true
                };
            case 'highlight':
                return {
                    ...base,
                    highlightStyle: 'default'
                };
            default:
                return base;
        }
    },

    /**
     * Validate item data before saving
     * @param {Object} data - Item data
     * @returns {Object} Validation result { valid: boolean, errors: string[] }
     */
    validateItem(data) {
        const errors = [];

        if (!data.title || data.title.trim().length === 0) {
            errors.push('Title is required');
        }

        if (data.title && data.title.length > 200) {
            errors.push('Title must be less than 200 characters');
        }

        if (data.url && data.url !== '#' && !this.isValidUrl(data.url)) {
            errors.push('Please enter a valid URL');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    /**
     * Check if a string is a valid URL
     * @param {string} str - String to check
     * @returns {boolean} Is valid URL
     */
    isValidUrl(str) {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Export all custom items
     * @returns {Object} Export data
     */
    exportItems() {
        return {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            items: this.getAllItems()
        };
    },

    /**
     * Import custom items
     * @param {Object} data - Import data
     * @param {boolean} merge - Merge with existing (true) or replace (false)
     * @returns {Object} Result { success: boolean, count: number }
     */
    importItems(data, merge = true) {
        if (!data.items || !Array.isArray(data.items)) {
            return { success: false, error: 'Invalid data format' };
        }

        if (merge) {
            const existingItems = this.getAllItems();
            const existingIds = new Set(existingItems.map(i => i.id));

            data.items.forEach(item => {
                if (!existingIds.has(item.id)) {
                    StorageManager.addCustomItem(item);
                }
            });
        } else {
            StorageManager.setCustomItems(data.items);
        }

        this.notifyChange();
        return { success: true, count: data.items.length };
    },

    /**
     * Clear all custom items
     */
    clearAll() {
        StorageManager.setCustomItems([]);
        this.notifyChange();
    },

    /**
     * Notify about changes
     */
    notifyChange() {
        if (this.onChange) {
            this.onChange(this.getAllItems());
        }

        window.dispatchEvent(new CustomEvent('customItemsChange', {
            detail: { items: this.getAllItems() }
        }));
    },

    /**
     * Render custom item badge HTML
     * @returns {string} HTML string
     */
    renderCustomBadge() {
        return '<span class="custom-item-badge">Custom</span>';
    },

    /**
     * Check if an item is custom
     * @param {Object} item - Item to check
     * @returns {boolean} Is custom
     */
    isCustomItem(item) {
        return item && (item.isCustom === true || (item.id && item.id.startsWith('custom-')));
    }
};

// Export for use in other modules
window.CustomItemManager = CustomItemManager;
