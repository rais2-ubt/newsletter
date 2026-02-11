/**
 * Scrape Dashboard Module
 * Visual status panel for monitoring scraping progress
 */

const ScrapeDashboard = {
    container: null,
    statusElements: {},
    progressBar: null,
    progressText: null,
    proxyHealthElement: null,
    errorDetails: {},
    lastScrapeTime: null,
    isExpanded: false,

    // Category configuration
    categories: {
        news: { label: 'News' },
        events: { label: 'Events' },
        lectures: { label: 'Lectures' },
        publications: { label: 'Publications' },
        members: { label: 'Members' },
        projects: { label: 'Projects' }
    },

    /**
     * Initialize the dashboard
     * @param {string|HTMLElement} containerOrId - Container element or ID
     */
    init(containerOrId) {
        if (typeof containerOrId === 'string') {
            this.container = document.getElementById(containerOrId);
        } else {
            this.container = containerOrId;
        }

        if (!this.container) {
            console.warn('ScrapeDashboard: Container not found');
            return;
        }

        this.render();
        this.attachEventListeners();
        console.log('ScrapeDashboard initialized');
    },

    /**
     * Render the dashboard HTML
     */
    render() {
        this.container.innerHTML = `
            <div class="scrape-dashboard" data-collapsed="true">
                <div class="scrape-dashboard-header">
                    <div class="scrape-dashboard-title">
                        <svg class="scrape-dashboard-icon" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                        </svg>
                        <span>Scraping Status</span>
                    </div>
                    <div class="scrape-dashboard-actions">
                        <button class="btn btn-primary btn-sm" id="dashboardScrapeBtn">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                            </svg>
                            Scrape Now
                        </button>
                        <button class="btn btn-sm btn-secondary scrape-toggle-btn" id="scrapeToggleBtn" title="Toggle details">
                            <svg class="toggle-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="scrape-dashboard-collapsible">
                    <div class="scrape-dashboard-proxy" id="proxyHealthStatus">
                        <span class="proxy-label">Proxy:</span>
                        <span class="proxy-status" id="proxyStatusText">Checking...</span>
                        <span class="proxy-separator">|</span>
                        <span class="last-scrape" id="lastScrapeText">Last: Never</span>
                    </div>

                    <div class="scrape-dashboard-table">
                        <div class="scrape-table-header">
                            <div class="scrape-col-type">Content Type</div>
                            <div class="scrape-col-status">Status</div>
                            <div class="scrape-col-items">Items</div>
                            <div class="scrape-col-source">Source</div>
                            <div class="scrape-col-action">Action</div>
                        </div>
                        <div class="scrape-table-body" id="scrapeTableBody">
                            ${Object.entries(this.categories).map(([key, cat]) => `
                                <div class="scrape-table-row" data-category="${key}">
                                    <div class="scrape-col-type">
                                        <span class="category-label">${cat.label}</span>
                                    </div>
                                    <div class="scrape-col-status">
                                        <span class="status-indicator status-pending" id="status-${key}">
                                            <span class="status-text">Pending</span>
                                        </span>
                                    </div>
                                    <div class="scrape-col-items">
                                        <span id="items-${key}">-</span>
                                    </div>
                                    <div class="scrape-col-source">
                                        <span id="source-${key}">-</span>
                                    </div>
                                    <div class="scrape-col-action">
                                        <button class="btn btn-sm btn-secondary retry-btn" data-category="${key}">
                                            Retry
                                        </button>
                                    </div>
                                </div>
                                <div class="scrape-error-details" id="error-${key}" style="display: none;">
                                    <div class="error-content"></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="scrape-dashboard-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" id="scrapeProgressBar" style="width: 0%"></div>
                        </div>
                        <div class="progress-text" id="scrapeProgressText">Ready to scrape</div>
                    </div>

                    <div class="scrape-dashboard-footer">
                        <button class="btn btn-sm btn-secondary" id="exportLogsBtn">
                            Export Logs
                        </button>
                        <button class="btn btn-sm btn-secondary" id="clearCacheBtn">
                            Clear Cache
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Store references to elements
        this.progressBar = document.getElementById('scrapeProgressBar');
        this.progressText = document.getElementById('scrapeProgressText');
        this.proxyHealthElement = document.getElementById('proxyStatusText');
        this.lastScrapeElement = document.getElementById('lastScrapeText');

        // Store status elements
        Object.keys(this.categories).forEach(key => {
            this.statusElements[key] = {
                status: document.getElementById(`status-${key}`),
                items: document.getElementById(`items-${key}`),
                source: document.getElementById(`source-${key}`),
                error: document.getElementById(`error-${key}`)
            };
        });
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Scrape Now button - also expands the dashboard
        const scrapeBtn = document.getElementById('dashboardScrapeBtn');
        if (scrapeBtn) {
            scrapeBtn.addEventListener('click', () => {
                this.expand();
                this.startScrape();
            });
        }

        // Toggle button
        const toggleBtn = document.getElementById('scrapeToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Retry buttons
        document.querySelectorAll('.retry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.retryCategory(category);
            });
        });

        // Export logs button
        const exportBtn = document.getElementById('exportLogsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (window.ScrapeLogger) {
                    ScrapeLogger.downloadLogs();
                }
            });
        }

        // Clear cache button
        const clearBtn = document.getElementById('clearCacheBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearCache());
        }
    },

    /**
     * Toggle dashboard expanded/collapsed state
     */
    toggle() {
        if (this.isExpanded) {
            this.collapse();
        } else {
            this.expand();
        }
    },

    /**
     * Expand the dashboard
     */
    expand() {
        this.isExpanded = true;
        const dashboard = this.container.querySelector('.scrape-dashboard');
        if (dashboard) {
            dashboard.dataset.collapsed = 'false';
        }
    },

    /**
     * Collapse the dashboard
     */
    collapse() {
        this.isExpanded = false;
        const dashboard = this.container.querySelector('.scrape-dashboard');
        if (dashboard) {
            dashboard.dataset.collapsed = 'true';
        }
    },

    /**
     * Update status for a category
     * @param {string} category - Category key
     * @param {string} status - Status: 'loading', 'success', 'cached', 'failed', 'pending'
     * @param {number} itemCount - Number of items (optional)
     */
    updateStatus(category, status, itemCount = null) {
        const elements = this.statusElements[category];
        if (!elements) return;

        const statusConfig = {
            loading: { text: 'Loading', class: 'status-loading' },
            success: { text: 'Success', class: 'status-success' },
            cached: { text: 'Cached', class: 'status-cached' },
            failed: { text: 'Failed', class: 'status-failed' },
            pending: { text: 'Pending', class: 'status-pending' }
        };

        const config = statusConfig[status] || statusConfig.pending;

        // Update status indicator
        elements.status.className = `status-indicator ${config.class}`;
        elements.status.innerHTML = `<span class="status-text">${config.text}</span>`;

        // Update item count
        if (itemCount !== null) {
            elements.items.textContent = itemCount;
        }

        // Update source
        if (status === 'success') {
            elements.source.textContent = 'Fresh';
            elements.source.className = 'source-fresh';
        } else if (status === 'cached') {
            const cached = StorageManager?.getCachedContent?.();
            const age = cached?.cachedAt ? this.formatAge(cached.cachedAt) : 'Unknown';
            elements.source.textContent = age;
            elements.source.className = 'source-cached';
        } else if (status === 'failed') {
            elements.source.textContent = '-';
            elements.source.className = 'source-failed';
        } else if (status === 'loading') {
            elements.source.textContent = '...';
        }

        // Hide error details on success/loading
        if (status !== 'failed') {
            elements.error.style.display = 'none';
        }
    },

    /**
     * Show error details for a category
     * @param {string} category - Category key
     * @param {string} errorMessage - Error message
     */
    showError(category, errorMessage) {
        const elements = this.statusElements[category];
        if (!elements) return;

        elements.error.style.display = 'block';
        elements.error.querySelector('.error-content').textContent = errorMessage;
    },

    /**
     * Update progress bar
     * @param {number} percent - Progress percentage (0-100)
     * @param {string} message - Progress message
     */
    updateProgress(percent, message) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percent}%`;
        }
        if (this.progressText) {
            this.progressText.textContent = message;
        }
    },

    /**
     * Update proxy health status
     * @param {number} healthy - Number of healthy proxies
     * @param {number} total - Total number of proxies
     */
    updateProxyHealth(healthy, total) {
        if (this.proxyHealthElement) {
            const className = healthy === 0 ? 'proxy-unhealthy' :
                              healthy < total / 2 ? 'proxy-partial' : 'proxy-healthy';
            this.proxyHealthElement.className = `proxy-status ${className}`;
            this.proxyHealthElement.textContent = `${healthy}/${total} healthy`;
        }
    },

    /**
     * Update last scrape time
     * @param {string|Date} timestamp - Last scrape timestamp
     */
    updateLastScrape(timestamp) {
        if (this.lastScrapeElement && timestamp) {
            this.lastScrapeElement.textContent = `Last: ${this.formatAge(timestamp)}`;
        }
    },

    /**
     * Format age as relative time
     * @param {string|Date} timestamp - Timestamp
     * @returns {string} Formatted age
     */
    formatAge(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    },

    /**
     * Start a fresh scrape
     */
    async startScrape() {
        const scrapeBtn = document.getElementById('dashboardScrapeBtn');
        if (scrapeBtn) {
            scrapeBtn.disabled = true;
            scrapeBtn.innerHTML = '<span class="spinner-small"></span> Scraping...';
        }

        // Reset all statuses to loading
        Object.keys(this.categories).forEach(key => {
            this.updateStatus(key, 'loading');
        });

        this.updateProgress(0, 'Starting fresh scrape...');

        try {
            if (window.RAIS2Scraper) {
                await RAIS2Scraper.scrapeAll(false, (progress) => {
                    this.updateProgress(progress.percent, progress.message);
                });
            }

            // Update last scrape time
            const cached = StorageManager?.getCachedContent?.();
            if (cached?.cachedAt) {
                this.updateLastScrape(cached.cachedAt);
            }

            if (window.App) {
                App.showToast('Scraping completed!', 'success');
            }
        } catch (error) {
            console.error('Scrape failed:', error);
            if (window.App) {
                App.showToast('Scraping failed: ' + error.message, 'error');
            }
        }

        if (scrapeBtn) {
            scrapeBtn.disabled = false;
            scrapeBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                </svg>
                Scrape Now
            `;
        }
    },

    /**
     * Retry a specific category
     * @param {string} category - Category to retry
     */
    async retryCategory(category) {
        this.updateStatus(category, 'loading');

        try {
            if (window.RAIS2Scraper && RAIS2Scraper.retryCategory) {
                const result = await RAIS2Scraper.retryCategory(category);

                if (result.status === 'success') {
                    this.updateStatus(category, 'success', result.data.length);
                    if (window.App) {
                        App.showToast(`${this.categories[category].label} refreshed!`, 'success');
                    }
                } else if (result.status === 'cached') {
                    this.updateStatus(category, 'cached', result.data.length);
                } else {
                    this.updateStatus(category, 'failed');
                    this.showError(category, result.error || 'Unknown error');
                }
            }
        } catch (error) {
            this.updateStatus(category, 'failed');
            this.showError(category, error.message);
        }
    },

    /**
     * Clear all caches
     */
    async clearCache() {
        if (!confirm('Clear all cached content and proxy scores?')) return;

        try {
            // Clear localStorage cache
            localStorage.removeItem('rais2_cached_content');

            // Clear proxy scores so all proxies get a fresh chance
            localStorage.removeItem('rais2_proxy_scores');
            if (window.ProxyScorer) {
                ProxyScorer.scores = {};
            }

            // Clear proxy health cache
            if (window.ProxyHealthChecker) {
                ProxyHealthChecker.clearCache();
            }

            // Clear IndexedDB if available
            if (window.IDBStorage) {
                await IDBStorage.clear();
            }

            // Clear Service Worker cache
            if (navigator.serviceWorker?.controller) {
                const messageChannel = new MessageChannel();
                navigator.serviceWorker.controller.postMessage(
                    { type: 'CLEAR_PROXY_CACHE' },
                    [messageChannel.port2]
                );
            }

            // Reset dashboard
            Object.keys(this.categories).forEach(key => {
                this.updateStatus(key, 'pending');
                this.statusElements[key].items.textContent = '-';
                this.statusElements[key].source.textContent = '-';
            });

            this.updateProgress(0, 'Cache cleared');
            this.lastScrapeElement.textContent = 'Last: Never';

            if (window.App) {
                App.showToast('Cache and proxy scores cleared!', 'success');
            }

            console.log('[Dashboard] Cleared: content cache, proxy scores, proxy health cache');
        } catch (error) {
            console.error('Clear cache failed:', error);
            if (window.App) {
                App.showToast('Failed to clear cache', 'error');
            }
        }
    },

    /**
     * Load initial status from cache
     */
    loadInitialStatus() {
        try {
            const cached = StorageManager?.getCachedContent?.();
            if (cached) {
                Object.keys(this.categories).forEach(key => {
                    const items = cached[key];
                    if (items && items.length > 0) {
                        this.updateStatus(key, 'cached', items.length);
                    } else {
                        this.updateStatus(key, 'pending');
                    }
                });

                if (cached.cachedAt) {
                    this.updateLastScrape(cached.cachedAt);
                }
            }

            // Update proxy health
            if (window.ProxyHealthChecker && window.RAIS2Scraper) {
                const health = ProxyHealthChecker.getHealthSummary(RAIS2Scraper.CORS_PROXIES);
                this.updateProxyHealth(health.healthy, health.total);
            }
        } catch (error) {
            console.warn('Failed to load initial status:', error);
        }
    }
};

// Export
window.ScrapeDashboard = ScrapeDashboard;
