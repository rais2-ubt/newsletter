/**
 * IndexedDB Storage Module
 * Provides larger-capacity storage beyond localStorage's 5MB limit
 * Falls back to localStorage if IndexedDB is unavailable
 */

const IDBStorage = {
    DB_NAME: 'rais2_newsletter',
    DB_VERSION: 1,
    STORE_NAME: 'scraped_content',
    db: null,
    available: false,

    /**
     * Initialize IndexedDB connection
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        if (!window.indexedDB) {
            console.warn('IndexedDB not supported, using localStorage fallback');
            this.available = false;
            return false;
        }

        return new Promise((resolve) => {
            try {
                const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

                request.onerror = (event) => {
                    console.warn('IndexedDB error:', event.target.error);
                    this.available = false;
                    resolve(false);
                };

                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.available = true;
                    console.log('IndexedDB initialized');
                    resolve(true);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Create object stores if they don't exist
                    if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                        const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'category' });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                        console.log('IndexedDB store created');
                    }
                };
            } catch (e) {
                console.warn('IndexedDB init failed:', e.message);
                this.available = false;
                resolve(false);
            }
        });
    },

    /**
     * Store content for a category
     * @param {string} category - Category key (news, events, etc.)
     * @param {Array} data - Array of items
     * @param {number} maxAge - Max age in ms (for expiry)
     * @returns {Promise<boolean>} Success status
     */
    async store(category, data, maxAge = 24 * 60 * 60 * 1000) {
        if (!this.available || !this.db) {
            // Fallback to localStorage
            return this._localStorageStore(category, data);
        }

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);

                const record = {
                    category,
                    data,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + maxAge
                };

                const request = store.put(record);

                request.onsuccess = () => resolve(true);
                request.onerror = () => {
                    console.warn('IndexedDB store failed, using localStorage');
                    resolve(this._localStorageStore(category, data));
                };
            } catch (e) {
                console.warn('IndexedDB store error:', e.message);
                resolve(this._localStorageStore(category, data));
            }
        });
    },

    /**
     * Retrieve content for a category
     * @param {string} category - Category key
     * @param {boolean} ignoreExpiry - Whether to return expired data
     * @returns {Promise<{data: Array, timestamp: number, expired: boolean}|null>}
     */
    async get(category, ignoreExpiry = false) {
        if (!this.available || !this.db) {
            // Fallback to localStorage
            return this._localStorageGet(category);
        }

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.get(category);

                request.onsuccess = () => {
                    const record = request.result;
                    if (!record) {
                        resolve(null);
                        return;
                    }

                    const expired = Date.now() > record.expiresAt;

                    if (expired && !ignoreExpiry) {
                        resolve(null);
                        return;
                    }

                    resolve({
                        data: record.data,
                        timestamp: record.timestamp,
                        expired
                    });
                };

                request.onerror = () => {
                    resolve(this._localStorageGet(category));
                };
            } catch (e) {
                resolve(this._localStorageGet(category));
            }
        });
    },

    /**
     * Store all content at once
     * @param {Object} content - Object with all categories
     * @returns {Promise<boolean>} Success status
     */
    async storeAll(content) {
        const categories = ['news', 'events', 'lectures', 'publications', 'members', 'projects'];
        const results = await Promise.all(
            categories.map(cat => this.store(cat, content[cat] || []))
        );
        return results.every(r => r);
    },

    /**
     * Get all content
     * @param {boolean} ignoreExpiry - Whether to return expired data
     * @returns {Promise<Object>} Content object
     */
    async getAll(ignoreExpiry = false) {
        const categories = ['news', 'events', 'lectures', 'publications', 'members', 'projects'];
        const content = {};
        let anyExpired = false;
        let timestamp = null;

        for (const cat of categories) {
            const result = await this.get(cat, ignoreExpiry);
            content[cat] = result?.data || [];
            if (result?.expired) anyExpired = true;
            if (result?.timestamp && (!timestamp || result.timestamp > timestamp)) {
                timestamp = result.timestamp;
            }
        }

        return {
            ...content,
            cachedAt: timestamp ? new Date(timestamp).toISOString() : null,
            expired: anyExpired
        };
    },

    /**
     * Clear all stored content
     * @returns {Promise<boolean>} Success status
     */
    async clear() {
        if (!this.available || !this.db) {
            localStorage.removeItem('rais2_idb_fallback');
            return true;
        }

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            } catch (e) {
                resolve(false);
            }
        });
    },

    /**
     * Get storage usage info
     * @returns {Promise<{used: number, available: number}>}
     */
    async getStorageInfo() {
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage || 0,
                    available: estimate.quota || 0,
                    percentUsed: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
                };
            } catch (e) {
                return { used: 0, available: 0, percentUsed: 0 };
            }
        }
        return { used: 0, available: 0, percentUsed: 0 };
    },

    /**
     * Clean up expired entries
     * @returns {Promise<number>} Number of entries cleaned
     */
    async cleanExpired() {
        if (!this.available || !this.db) return 0;

        return new Promise((resolve) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const index = store.index('timestamp');
                const now = Date.now();
                let cleaned = 0;

                const request = index.openCursor();

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        if (cursor.value.expiresAt < now) {
                            cursor.delete();
                            cleaned++;
                        }
                        cursor.continue();
                    } else {
                        resolve(cleaned);
                    }
                };

                request.onerror = () => resolve(0);
            } catch (e) {
                resolve(0);
            }
        });
    },

    // localStorage fallback methods

    _localStorageStore(category, data) {
        try {
            const key = `rais2_idb_${category}`;
            const record = {
                data,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(record));
            return true;
        } catch (e) {
            console.warn('localStorage store failed:', e.message);
            return false;
        }
    },

    _localStorageGet(category) {
        try {
            const key = `rais2_idb_${category}`;
            const stored = localStorage.getItem(key);
            if (!stored) return null;

            const record = JSON.parse(stored);
            return {
                data: record.data,
                timestamp: record.timestamp,
                expired: false // localStorage doesn't track expiry in this fallback
            };
        } catch (e) {
            return null;
        }
    }
};

// Auto-initialize when script loads
IDBStorage.init().catch(console.warn);

// Export
window.IDBStorage = IDBStorage;
