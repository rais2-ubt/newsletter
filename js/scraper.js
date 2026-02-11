/**
 * Scraper Module
 * Handles web scraping of RAIS2 website using CORS proxies
 */

/**
 * ProxyHealthChecker - Tests proxies before using them
 * Caches health status for 5 minutes
 */
const ProxyHealthChecker = {
    healthCache: new Map(),
    HEALTH_TTL: 5 * 60 * 1000, // 5 minutes
    TEST_URL: 'https://www.rais2.uni-bayreuth.de/en/',
    TEST_TIMEOUT: 5000,

    /**
     * Check if a proxy is healthy
     * @param {Function} proxyFn - Proxy function that takes URL and returns proxy URL
     * @param {number} proxyIndex - Index of proxy for caching
     * @returns {Promise<{healthy: boolean, latency: number}>}
     */
    async checkProxy(proxyFn, proxyIndex) {
        const cacheKey = `proxy_${proxyIndex}`;
        const cached = this.healthCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.HEALTH_TTL) {
            return { healthy: cached.healthy, latency: cached.latency, fromCache: true };
        }

        const startTime = performance.now();
        try {
            const proxyUrl = proxyFn(this.TEST_URL);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.TEST_TIMEOUT);

            const response = await fetch(proxyUrl, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-store'
            });

            clearTimeout(timeoutId);
            const latency = Math.round(performance.now() - startTime);
            const healthy = response.ok;

            this.healthCache.set(cacheKey, { healthy, latency, timestamp: Date.now() });
            return { healthy, latency, fromCache: false };
        } catch (e) {
            const latency = Math.round(performance.now() - startTime);
            this.healthCache.set(cacheKey, { healthy: false, latency, timestamp: Date.now() });
            return { healthy: false, latency, fromCache: false };
        }
    },

    /**
     * Get all healthy proxies from a list
     * @param {Array<Function>} proxies - Array of proxy functions
     * @returns {Promise<Array<{index: number, proxyFn: Function, latency: number}>>}
     */
    async getHealthyProxies(proxies) {
        const results = await Promise.all(
            proxies.map((proxyFn, index) =>
                this.checkProxy(proxyFn, index).then(result => ({ ...result, index, proxyFn }))
            )
        );
        return results
            .filter(r => r.healthy)
            .sort((a, b) => a.latency - b.latency);
    },

    /**
     * Get health summary for dashboard
     * @param {Array<Function>} proxies - Array of proxy functions
     * @returns {{healthy: number, total: number}}
     */
    getHealthSummary(proxies) {
        let healthy = 0;
        proxies.forEach((_, index) => {
            const cached = this.healthCache.get(`proxy_${index}`);
            if (cached && cached.healthy && Date.now() - cached.timestamp < this.HEALTH_TTL) {
                healthy++;
            }
        });
        return { healthy, total: proxies.length };
    },

    /**
     * Clear health cache
     */
    clearCache() {
        this.healthCache.clear();
    }
};

/**
 * ProxyScorer - Tracks success/failure rates per proxy
 * Used to prioritize reliable proxies
 */
const ProxyScorer = {
    scores: {},
    STORAGE_KEY: 'rais2_proxy_scores',

    /**
     * Initialize scores from localStorage
     */
    init() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.scores = JSON.parse(stored);
            }
        } catch (e) {
            this.scores = {};
        }
    },

    /**
     * Save scores to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.scores));
        } catch (e) {
            // Storage full or unavailable
        }
    },

    /**
     * Get or create score entry for proxy
     * @param {number} index - Proxy index
     * @returns {Object} Score entry
     */
    getEntry(index) {
        if (!this.scores[index]) {
            this.scores[index] = { successes: 0, failures: 0, totalLatency: 0 };
        }
        return this.scores[index];
    },

    /**
     * Record a successful proxy request
     * @param {number} index - Proxy index
     * @param {number} latencyMs - Request latency in ms
     */
    recordSuccess(index, latencyMs) {
        const entry = this.getEntry(index);
        entry.successes++;
        entry.totalLatency += latencyMs;
        this.save();
    },

    /**
     * Record a failed proxy request
     * @param {number} index - Proxy index
     */
    recordFailure(index) {
        const entry = this.getEntry(index);
        entry.failures++;
        this.save();
    },

    /**
     * Get success rate for a proxy
     * @param {number} index - Proxy index
     * @returns {number} Success rate (0-1)
     */
    getSuccessRate(index) {
        const entry = this.getEntry(index);
        const total = entry.successes + entry.failures;
        return total === 0 ? 0.5 : entry.successes / total; // Default to 50% for new proxies
    },

    /**
     * Get average latency for a proxy
     * @param {number} index - Proxy index
     * @returns {number} Average latency in ms
     */
    getAvgLatency(index) {
        const entry = this.getEntry(index);
        return entry.successes === 0 ? 10000 : entry.totalLatency / entry.successes;
    },

    /**
     * Get proxies sorted by score (best first)
     * Score = success_rate * (1 / avg_latency)
     * @param {Array<Function>} proxies - Array of proxy functions
     * @returns {Array<{index: number, proxyFn: Function, score: number}>}
     */
    getSortedProxies(proxies) {
        return proxies
            .map((proxyFn, index) => {
                const successRate = this.getSuccessRate(index);
                const avgLatency = this.getAvgLatency(index);
                // Score: higher is better (success rate weighted, latency penalized)
                const score = successRate * (10000 / avgLatency);
                return { index, proxyFn, score, successRate, avgLatency };
            })
            .sort((a, b) => b.score - a.score);
    },

    /**
     * Get statistics for all proxies
     * @param {Array<Function>} proxies - Array of proxy functions
     * @returns {Array<Object>} Stats per proxy
     */
    getStats(proxies) {
        return proxies.map((_, index) => {
            const entry = this.getEntry(index);
            return {
                index,
                successes: entry.successes,
                failures: entry.failures,
                successRate: this.getSuccessRate(index),
                avgLatency: Math.round(this.getAvgLatency(index))
            };
        });
    },

    /**
     * Reset all scores
     */
    reset() {
        this.scores = {};
        this.save();
    }
};

// Initialize proxy scorer on load
ProxyScorer.init();

/**
 * ScrapeLogger - Comprehensive error tracking for debugging
 */
const ScrapeLogger = {
    logs: [],
    MAX_LOGS: 500,
    STORAGE_KEY: 'rais2_scrape_logs',

    /**
     * Log an event
     * @param {string} category - Content category (news, events, etc.) or 'system'
     * @param {string} event - Event type: start, success, retry, failed, cached
     * @param {Object} details - Additional details
     */
    log(category, event, details = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            category,
            event,
            details
        };

        this.logs.push(entry);

        // Trim old logs
        if (this.logs.length > this.MAX_LOGS) {
            this.logs = this.logs.slice(-this.MAX_LOGS);
        }

        // Also log to console for debugging
        const logFn = event === 'failed' ? console.warn : console.log;
        logFn(`[ScrapeLog] ${category}:${event}`, details);
    },

    /**
     * Get logs for the last scrape session
     * @returns {Array<Object>} Recent logs
     */
    getRecentLogs() {
        // Find the most recent 'start' with category 'system'
        let sessionStart = -1;
        for (let i = this.logs.length - 1; i >= 0; i--) {
            if (this.logs[i].category === 'system' && this.logs[i].event === 'start') {
                sessionStart = i;
                break;
            }
        }
        return sessionStart >= 0 ? this.logs.slice(sessionStart) : this.logs.slice(-50);
    },

    /**
     * Get summary report of last scrape session
     * @returns {Object} Summary with counts per status
     */
    getReport() {
        const recent = this.getRecentLogs();
        const report = {
            totalLogs: recent.length,
            byCategory: {},
            byEvent: { start: 0, success: 0, retry: 0, failed: 0, cached: 0 },
            errors: []
        };

        recent.forEach(log => {
            // Count by event type
            if (report.byEvent[log.event] !== undefined) {
                report.byEvent[log.event]++;
            }

            // Group by category
            if (!report.byCategory[log.category]) {
                report.byCategory[log.category] = { events: [], lastStatus: null };
            }
            report.byCategory[log.category].events.push(log.event);
            report.byCategory[log.category].lastStatus = log.event;

            // Collect errors
            if (log.event === 'failed' || log.details.error) {
                report.errors.push({
                    category: log.category,
                    error: log.details.error || log.details.message || 'Unknown error',
                    timestamp: log.timestamp
                });
            }
        });

        return report;
    },

    /**
     * Export logs as JSON for debugging
     * @returns {string} JSON string of logs
     */
    exportLogs() {
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            logs: this.logs,
            report: this.getReport()
        }, null, 2);
    },

    /**
     * Download logs as a file
     */
    downloadLogs() {
        const content = this.exportLogs();
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scrape-logs-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Clear all logs
     */
    clear() {
        this.logs = [];
    }
};

// Export helpers
window.ProxyHealthChecker = ProxyHealthChecker;
window.ProxyScorer = ProxyScorer;
window.ScrapeLogger = ScrapeLogger;

const RAIS2Scraper = {
    // Target URLs
    BASE_URL: 'https://www.rais2.uni-bayreuth.de/en/',
    NEWS_URL: 'https://www.rais2.uni-bayreuth.de/en/news/index.php',
    EVENTS_URL: 'https://www.rais2.uni-bayreuth.de/en/events/index.html',
    LECTURES_URL: 'https://www.rais2.uni-bayreuth.de/en/events/lecture_series/index.html',
    PUBLICATIONS_URL: 'https://www.rais2.uni-bayreuth.de/en/research/publications/index.php',
    MEMBERS_URL: 'https://www.rais2.uni-bayreuth.de/en/about/members/index.html',
    PROJECTS_URL: 'https://www.rais2.uni-bayreuth.de/en/research/projects/index.html',

    // Network defaults
    DEFAULT_TIMEOUT_MS: 30000,
    PROXY_RETRY_DELAY_MS: 350,

    // CORS Proxies with fallback chain (tiered by reliability)
    CORS_PROXIES: [
        // Tier 1: Most reliable (2025)
        url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        url => `https://proxy.cors.sh/${url}`,
        // Tier 2: Good alternatives
        url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        url => `https://corsproxy.org/?${encodeURIComponent(url)}`,
        url => `https://cors.eu.org/${url}`,
        // Tier 3: Additional fallbacks
        url => `https://thingproxy.freeboard.io/fetch/${url}`,
        url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, // JSON wrapper variant
        url => `https://api.cors.lol/?url=${encodeURIComponent(url)}`,
        // Tier 4: Backup proxies (may have limitations)
        url => `https://yacdn.org/proxy/${url}`,
        url => `https://cors-anywhere.herokuapp.com/${url}`
    ],

    // Navigation items to exclude
    NAV_ITEMS: new Set([
        'Close', 'Back', 'Overview', 'Home', 'About', 'Research',
        'Education', 'Events', 'News', 'Newsletter', 'Contact',
        'Deutsch', 'English', 'Intranet', 'menu bar', 'Mobile Menu',
        'Search', 'Print page', 'Sitemap'
    ]),

    // Debug logging (console only, no remote)
    _debugLog(loc, msg, data, hyp) {
        // Disabled in production - uncomment for debugging
        // console.log('[DEBUG]', {location:loc, message:msg, data:data});
    },

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    _looksLikeHtml(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return false;
        const first = trimmed[0];
        if (first === '{' || first === '[') return false; // likely JSON
        const head = trimmed.slice(0, 500).toLowerCase();
        // Check for common HTML markers
        return head.includes('<!doctype') ||
               head.includes('<html') ||
               head.includes('<body') ||
               head.includes('<head') ||
               head.includes('<div') ||
               head.includes('<meta') ||
               head.includes('<link');
    },

    _cleanText(text) {
        return (text || '')
            .replace(/[\u00A0\u200B]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    },

    async _fetchWithTimeout(url, options = {}, timeoutMs) {
        const effectiveTimeoutMs = Number.isFinite(timeoutMs) ? timeoutMs : this.DEFAULT_TIMEOUT_MS;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), effectiveTimeoutMs);
        try {
            return await fetch(url, {
                ...options,
                signal: controller.signal
            });
        } finally {
            clearTimeout(id);
        }
    },

    /**
     * Fetch page content using CORS proxy with fallback
     * Uses ProxyScorer to prioritize reliable proxies
     * @param {string} url - Target URL
     * @param {Object} options - Fetch options
     * @returns {Promise<string|null>} HTML content or null on failure
     */
    async fetchPage(url, options = {}) {
        // #region agent log
        this._debugLog('scraper.js:fetchPage:entry','fetchPage called',{url},'H1');
        // #endregion
        const settings = StorageManager.getAppSettings();
        const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : this.DEFAULT_TIMEOUT_MS;

        // Get proxies sorted by score (best first)
        const sortedProxies = ProxyScorer.getSortedProxies(this.CORS_PROXIES);

        for (let i = 0; i < sortedProxies.length; i++) {
            const { index: proxyIndex, proxyFn } = sortedProxies[i];
            const startTime = performance.now();

            try {
                const proxyUrl = proxyFn(url);
                console.log(`[Scraper] Trying proxy ${proxyIndex + 1}/${sortedProxies.length}:`, proxyUrl.split('?')[0].split('/').slice(0,4).join('/'));
                // #region agent log
                this._debugLog('scraper.js:fetchPage:proxy','Trying proxy',{proxyIndex,proxyUrl},'H1');
                // #endregion
                const response = await this._fetchWithTimeout(proxyUrl, {
                    cache: 'no-store',
                    credentials: 'omit',
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml'
                    }
                }, timeoutMs);

                if (response.ok) {
                    let text = await response.text();

                    // Handle JSON wrapper variant (allorigins /get endpoint)
                    if (text.startsWith('{') && proxyUrl.includes('allorigins.win/get')) {
                        try {
                            const json = JSON.parse(text);
                            text = json.contents || text;
                        } catch (e) {
                            // Not valid JSON, use as-is
                        }
                    }

                    // Real RAIS2 pages are 10KB+, proxy errors are usually <1KB
                    const MIN_VALID_LENGTH = 5000;
                    if (!this._looksLikeHtml(text) || text.length < MIN_VALID_LENGTH) {
                        // Proxy returned error page or placeholder
                        console.warn(`[Scraper] Proxy ${proxyIndex + 1} returned too-short content (${text.length} chars, need ${MIN_VALID_LENGTH}+)`);
                        if (text.length < 500) {
                            console.warn(`[Scraper] Content preview: ${text.substring(0, 200)}...`);
                        }
                        ProxyScorer.recordFailure(proxyIndex);
                        continue;
                    }

                    const latency = Math.round(performance.now() - startTime);
                    console.log(`[Scraper] SUCCESS - Proxy ${proxyIndex + 1} worked (${latency}ms, ${text.length} chars)`);
                    // #region agent log
                    this._debugLog('scraper.js:fetchPage:success','Proxy succeeded',{proxyIndex,htmlLength:text.length,latency},'H1');
                    // #endregion

                    // Record success with ProxyScorer
                    ProxyScorer.recordSuccess(proxyIndex, latency);

                    // Update preferred proxy on success
                    StorageManager.setAppSettings({ preferredProxy: proxyIndex });

                    return text;
                }
                // #region agent log
                this._debugLog('scraper.js:fetchPage:nonOk','Proxy returned non-OK response',{proxyIndex,status:response.status,statusText:response.statusText},'H1');
                // #endregion
                ProxyScorer.recordFailure(proxyIndex);
            } catch (e) {
                const isTimeout = e?.name === 'AbortError';
                // #region agent log
                this._debugLog('scraper.js:fetchPage:error','Proxy failed',{proxyIndex,error:e.message,isTimeout},'H1');
                // #endregion
                console.warn(`Proxy ${proxyIndex} failed for ${url}:`, e.message);
                ProxyScorer.recordFailure(proxyIndex);
            }

            // Small delay between proxy attempts to reduce rate limiting.
            if (i < sortedProxies.length - 1 && this.PROXY_RETRY_DELAY_MS > 0) {
                await this._sleep(this.PROXY_RETRY_DELAY_MS);
            }
        }

        // #region agent log
        this._debugLog('scraper.js:fetchPage:allFailed','All proxies failed',{url},'H1');
        // #endregion
        console.error(`[Scraper] All ${sortedProxies.length} proxies failed for ${url}`);
        console.error(`[Scraper] This usually means: 1) Network issue, 2) All CORS proxies are down, or 3) Target site is blocking requests`);
        return null;
    },

    /**
     * Generate unique ID for an item
     * @param {string} title - Item title
     * @param {string} date - Item date
     * @returns {string} Unique ID
     */
    generateId(title, date) {
        const content = `${title}|${date}`;
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).substring(0, 12);
    },

    /**
     * Parse HTML string to DOM
     * @param {string} html - HTML string
     * @returns {Document} Parsed document
     */
    parseHTML(html) {
        const parser = new DOMParser();
        return parser.parseFromString(html, 'text/html');
    },

    /**
     * Extract news items from main page sidebar
     * @param {Document} doc - Parsed document
     * @returns {Array} News items
     */
    extractNewsFromMainPage(doc) {
        const items = [];

        // Look for news sidebar section: <section class="sidebar grey news">
        const newsSection = doc.querySelector('section.news, .sidebar.news');
        if (!newsSection) return items;

        // Each news item is in a <p> tag with date, <strong> title, and <a> link
        const paragraphs = newsSection.querySelectorAll('p');
        paragraphs.forEach(p => {
            const text = p.textContent || '';
            const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/);
            if (!dateMatch) return;

            const date = dateMatch[1];
            const strong = p.querySelector('strong');
            const link = p.querySelector('a[href]');

            if (!strong || !link) return;

            const title = strong.textContent.trim();
            const href = link.getAttribute('href');
            const url = href.startsWith('http') ? href : new URL(href, this.BASE_URL).href;

            if (title && title.length > 5 && !this.NAV_ITEMS.has(title)) {
                const id = this.generateId(title, date);
                if (!items.some(i => i.id === id)) {
                    items.push({
                        id,
                        title,
                        date,
                        summary: '',
                        url,
                        category: 'news'
                    });
                }
            }
        });

        return items;
    },

    /**
     * Extract news items from news page table
     * @param {Document} doc - Parsed document
     * @returns {Array} News items
     */
    extractNewsFromNewsPage(doc) {
        const items = [];

        // News page uses table with <tr> rows
        // First <td> has date, second <td class="noduplicate"> has link with title
        const rows = doc.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 2) return;

            const dateCell = cells[0];
            const titleCell = cells[1];

            const dateMatch = (dateCell.textContent || '').match(/(\d{2}\.\d{2}\.\d{4})/);
            if (!dateMatch) return;

            const date = dateMatch[1];
            const link = titleCell.querySelector('a[href]');
            if (!link) return;

            const title = link.textContent.trim();
            const href = link.getAttribute('href');
            const url = href.startsWith('http') ? href : new URL(href, this.NEWS_URL).href;

            if (title && title.length > 5 && !this.NAV_ITEMS.has(title)) {
                const id = this.generateId(title, date);
                if (!items.some(i => i.id === id)) {
                    items.push({
                        id,
                        title,
                        date,
                        summary: '',
                        url,
                        category: 'news'
                    });
                }
            }
        });

        return items;
    },

    /**
     * Scrape news items
     * @returns {Promise<Array>} News items
     */
    async scrapeNews() {
        // #region agent log
        this._debugLog('scraper.js:scrapeNews:entry','scrapeNews called',{},'H3');
        // #endregion
        const items = [];

        // Try main page sidebar
        const mainHtml = await this.fetchPage(this.BASE_URL);
        // #region agent log
        this._debugLog('scraper.js:scrapeNews:mainHtml','Main page fetched',{hasHtml:!!mainHtml,htmlLength:mainHtml?.length||0},'H1,H3');
        // #endregion
        if (mainHtml) {
            const mainDoc = this.parseHTML(mainHtml);
            const mainItems = this.extractNewsFromMainPage(mainDoc);
            // #region agent log
            this._debugLog('scraper.js:scrapeNews:mainItems','Extracted from main page sidebar',{count:mainItems.length},'H3');
            // #endregion
            items.push(...mainItems);
        }

        // Try news page table
        const newsHtml = await this.fetchPage(this.NEWS_URL);
        // #region agent log
        this._debugLog('scraper.js:scrapeNews:newsHtml','News page fetched',{hasHtml:!!newsHtml,htmlLength:newsHtml?.length||0},'H1,H3');
        // #endregion
        if (newsHtml) {
            const newsDoc = this.parseHTML(newsHtml);
            const newsItems = this.extractNewsFromNewsPage(newsDoc);
            // #region agent log
            this._debugLog('scraper.js:scrapeNews:newsItems','Extracted from news page table',{count:newsItems.length},'H3');
            // #endregion
            items.push(...newsItems);
        }

        // Deduplicate
        const seen = new Set();
        const dedupedItems = items.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
        // #region agent log
        this._debugLog('scraper.js:scrapeNews:exit','scrapeNews completed',{totalItems:dedupedItems.length},'H3');
        // #endregion
        return dedupedItems;
    },

    /**
     * Scrape events
     * @returns {Promise<Array>} Event items
     */
    async scrapeEvents() {
        const items = [];
        const byUrl = new Map();
        const html = await this.fetchPage(this.EVENTS_URL);

        if (!html) return items;

        const doc = this.parseHTML(html);
        const content = doc.querySelector('#content') || doc.body;

        const links = content.querySelectorAll('a[href]');
        links.forEach(link => {
            const hrefRaw = (link.getAttribute('href') || '').trim();
            if (!hrefRaw) return;
            if (hrefRaw.startsWith('#') || hrefRaw.startsWith('javascript:')) return;
            if (hrefRaw.startsWith('mailto:') || hrefRaw.startsWith('tel:')) return;

            let absoluteUrl;
            try {
                absoluteUrl = hrefRaw.startsWith('http') ? hrefRaw : new URL(hrefRaw, this.EVENTS_URL).href;
            } catch {
                return;
            }

            // Keep internal RAIS2 event pages only.
            try {
                const urlObj = new URL(absoluteUrl);
                if (!urlObj.hostname.endsWith('rais2.uni-bayreuth.de')) return;
                if (!urlObj.pathname.includes('/en/events/')) return;
            } catch {
                return;
            }

            // Match event-related links (avoid pulling in unrelated event navigation pages).
            const isEvent = absoluteUrl.includes('/events/ai_day') ||
                           absoluteUrl.includes('/events/ai_day_') ||
                           absoluteUrl.includes('/events/lecture_series') ||
                           absoluteUrl.includes('/events/workshop') ||
                           absoluteUrl.includes('/events/archive');
            if (!isEvent) return;

            const text = this._cleanText(link.textContent);
            const titleAttr = this._cleanText(link.getAttribute('title'));
            let title = text;
            if (titleAttr && titleAttr.length > title.length) title = titleAttr;

            if (!title || title.length < 5) return;
            if (this.NAV_ITEMS.has(title) || title.includes('Overview') || title === '...more') return;

            const yearMatch = absoluteUrl.match(/20\d{2}/);
            const date = yearMatch ? yearMatch[0] : 'Ongoing';

            const existing = byUrl.get(absoluteUrl);
            if (!existing || title.length > existing.title.length) {
                byUrl.set(absoluteUrl, { title, date, url: absoluteUrl });
            }
        });

        for (const { title, date, url } of byUrl.values()) {
            const id = this.generateId(title, date);
            items.push({
                id,
                title,
                date,
                summary: '',
                url,
                category: 'event'
            });
        }

        const score = (d) => {
            const year = Number.parseInt(d, 10);
            return Number.isFinite(year) ? year : -1;
        };
        return items.sort((a, b) => score(b.date) - score(a.date));
    },

    /**
     * Scrape lectures
     * @returns {Promise<Array>} Lecture items
     */
    async scrapeLectures() {
        const items = [];
        const html = await this.fetchPage(this.LECTURES_URL);

        if (!html) return items;

        const doc = this.parseHTML(html);
        const content = doc.querySelector('#content') || doc.body;
        const accordion = content.querySelector('dl.accordion');

        if (accordion) {
            const headings = accordion.querySelectorAll('dt.fse-accordion-heading');
            headings.forEach(dt => {
                const titleAnchor = dt.querySelector('a:not(.close)');
                const title = this._cleanText(titleAnchor?.textContent);
                if (!title || title.length < 5 || this.NAV_ITEMS.has(title)) return;

                const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === 'DD'
                    ? dt.nextElementSibling
                    : null;

                let url = this.LECTURES_URL;
                let summary = '';
                if (dd) {
                    const link = dd.querySelector('a[href]:not([href^="javascript"])');
                    if (link) {
                        const href = (link.getAttribute('href') || '').trim();
                        if (href) {
                            try {
                                url = href.startsWith('http') ? href : new URL(href, this.LECTURES_URL).href;
                            } catch {
                                url = this.LECTURES_URL;
                            }
                        }
                    }

                    const p = dd.querySelector('p');
                    summary = this._cleanText(p?.textContent);
                    if (summary.length > 220) summary = summary.slice(0, 217) + '...';
                }

                const date = 'Ongoing';
                const id = this.generateId(title, date);
                items.push({
                    id,
                    title,
                    date,
                    summary,
                    url,
                    category: 'lecture'
                });
            });
        }

        // Fallback: if the page structure changes, try a lightweight heuristic scan.
        if (items.length === 0) {
            const entries = content.querySelectorAll('div, article, li, p');
            entries.forEach(entry => {
                const text = this._cleanText(entry.textContent);
                if (!text || text.length < 20 || text.length > 500) return;

                const hasDate = text.match(/\d{1,2}\.\d{1,2}\.\d{4}/);
                const hasSpeaker = ['prof', 'dr.', 'speaker', 'lecture on', 'talk on']
                    .some(kw => text.toLowerCase().includes(kw));
                if (!hasDate && !hasSpeaker) return;

                const link = entry.querySelector('a[href]');
                let url = this.LECTURES_URL;
                if (link) {
                    const href = (link.getAttribute('href') || '').trim();
                    if (href) {
                        try {
                            url = href.startsWith('http') ? href : new URL(href, this.LECTURES_URL).href;
                        } catch {
                            url = this.LECTURES_URL;
                        }
                    }
                }

                const titleElem = entry.querySelector('strong, b, h3, h4');
                let title = this._cleanText(titleElem?.textContent) || this._cleanText(link?.textContent);
                if (!title) title = text.slice(0, 80) + (text.length > 80 ? '...' : '');
                if (!title || title.length < 10 || this.NAV_ITEMS.has(title)) return;

                const date = hasDate ? hasDate[0] : 'Ongoing';
                const id = this.generateId(title, date);
                let summary = text.slice(0, 220);
                if (summary.length > 220) summary = summary.slice(0, 217) + '...';

                items.push({
                    id,
                    title,
                    date,
                    summary,
                    url,
                    category: 'lecture'
                });
            });
        }

        return items;
    },

    /**
     * Extract publications from publications page
     * @param {Document} doc - Parsed document
     * @returns {Array} Publication items with year info
     */
    extractPublicationsFromPage(doc) {
        const items = [];
        const content = doc.querySelector('#content') || doc.body;

        console.log('[Scraper] Extracting publications, content element:', content?.tagName);

        // Publications are organized by year in <p><strong>YEAR</strong></p> format
        // Each publication is in a <p> tag with:
        // - Authors in <i>
        // - Title in <strong><a href="eref...">
        let currentYear = new Date().getFullYear().toString();

        // Get all paragraph elements
        const paragraphs = content.querySelectorAll('p');
        console.log('[Scraper] Found paragraphs:', paragraphs.length);

        // Also check for eref links directly
        const allErefLinks = content.querySelectorAll('a[href*="eref.uni-bayreuth.de"]');
        console.log('[Scraper] Found eref links:', allErefLinks.length);

        paragraphs.forEach(p => {
            const text = this._cleanText(p.textContent);

            // Check if this is a year header: <p><strong>2026</strong></p>
            // Year paragraphs are short and contain just the year
            const yearMatch = text.match(/^(20\d{2})$/);
            if (yearMatch) {
                currentYear = yearMatch[1];
                return;
            }

            // Look for eref link inside <strong> tag - this is the publication title
            const strongLink = p.querySelector('strong > a[href*="eref.uni-bayreuth.de"]');
            if (!strongLink) return;

            const href = strongLink.getAttribute('href') || '';
            const title = this._cleanText(strongLink.textContent);

            // Skip if title is too short
            if (!title || title.length < 10) return;

            // Extract authors from <i> tag at the beginning of the paragraph
            let authors = '';
            const italicEl = p.querySelector('i');
            if (italicEl) {
                authors = this._cleanText(italicEl.textContent);
                // Clean up author string (remove trailing semicolons, etc.)
                authors = authors.replace(/[;\s]+$/, '').trim();
            }

            // Construct absolute URL
            let absoluteUrl;
            try {
                absoluteUrl = href.startsWith('http') ? href : new URL(href, this.PUBLICATIONS_URL).href;
            } catch {
                return;
            }

            // Extract erefId from URL (e.g., https://eref.uni-bayreuth.de/95864 -> 95864)
            // Higher erefId = newer publication (used for secondary sorting within same year)
            const erefMatch = absoluteUrl.match(/eref\.uni-bayreuth\.de\/(\d+)/);
            const erefId = erefMatch ? parseInt(erefMatch[1], 10) : 0;

            const id = this.generateId(title, currentYear);

            // Avoid duplicates
            if (!items.some(i => i.id === id || i.title === title)) {
                items.push({
                    id,
                    title,
                    date: currentYear,
                    summary: authors,
                    url: absoluteUrl,
                    category: 'publication',
                    pillar: '',
                    erefId: erefId
                });
            }
        });

        // If no publications found with the primary method, try fallback
        console.log('[Scraper] Publications found with primary method:', items.length);
        if (items.length === 0) {
            console.log('[Scraper] Trying fallback method for publications...');
            // Fallback: look for any eref links
            const erefLinks = content.querySelectorAll('a[href*="eref.uni-bayreuth.de"]');
            erefLinks.forEach(link => {
                const href = link.getAttribute('href') || '';
                const title = this._cleanText(link.textContent);

                if (!title || title.length < 10) return;
                if (this.NAV_ITEMS.has(title)) return;

                let absoluteUrl;
                try {
                    absoluteUrl = href.startsWith('http') ? href : new URL(href, this.PUBLICATIONS_URL).href;
                } catch {
                    return;
                }

                // Extract erefId from URL for sorting
                const erefMatch = absoluteUrl.match(/eref\.uni-bayreuth\.de\/(\d+)/);
                const erefId = erefMatch ? parseInt(erefMatch[1], 10) : 0;

                const id = this.generateId(title, currentYear);

                if (!items.some(i => i.id === id || i.title === title)) {
                    items.push({
                        id,
                        title,
                        date: currentYear,
                        summary: '',
                        url: absoluteUrl,
                        category: 'publication',
                        pillar: '',
                        erefId: erefId
                    });
                }
            });
        }

        return items;
    },

    /**
     * Fetch detailed date from eref page (optional - slow)
     * @param {string} erefUrl - eref.uni-bayreuth.de URL
     * @returns {Promise<string|null>} Date in DD.MM.YYYY format or null
     */
    async fetchErefDate(erefUrl) {
        try {
            const html = await this.fetchPage(erefUrl);
            if (!html) return null;

            const doc = this.parseHTML(html);
            const text = doc.body.textContent || '';

            // Look for "Date Deposited: 22 Dec 2025 11:28" pattern
            const dateMatch = text.match(/Date Deposited:\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i);
            if (dateMatch) {
                const [, day, monthName, year] = dateMatch;
                const months = {
                    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
                    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
                    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
                };
                const month = months[monthName.toLowerCase().slice(0, 3)] || '01';
                return `${day.padStart(2, '0')}.${month}.${year}`;
            }

            return null;
        } catch (e) {
            console.warn('Failed to fetch eref date:', e.message);
            return null;
        }
    },

    /**
     * Scrape publications
     * @param {Object} options - Options for scraping
     * @param {boolean} options.fetchDetailedDates - Whether to fetch dates from eref (slow)
     * @param {number} options.detailedDateLimit - Max items to fetch detailed dates for
     * @param {Function} options.onProgress - Progress callback
     * @returns {Promise<Array>} Publication items
     */
    async scrapePublications(options = {}) {
        const {
            fetchDetailedDates = false,
            detailedDateLimit = 10,
            onProgress = null
        } = options;

        console.log('[Scraper] Fetching publications from:', this.PUBLICATIONS_URL);
        const html = await this.fetchPage(this.PUBLICATIONS_URL);
        if (!html) {
            console.error('[Scraper] Failed to fetch publications page');
            return [];
        }
        console.log('[Scraper] Publications page fetched, length:', html.length);

        const doc = this.parseHTML(html);
        let items = this.extractPublicationsFromPage(doc);
        console.log('[Scraper] Extracted publications:', items.length);

        // Optionally fetch detailed dates from eref pages
        if (fetchDetailedDates && items.length > 0) {
            const toFetch = items.slice(0, detailedDateLimit);

            for (let i = 0; i < toFetch.length; i++) {
                const item = toFetch[i];
                if (item.url.includes('eref.uni-bayreuth.de')) {
                    if (onProgress) {
                        onProgress({
                            phase: 'publication-dates',
                            current: i + 1,
                            total: toFetch.length,
                            message: `Fetching date ${i + 1}/${toFetch.length}...`
                        });
                    }

                    const detailedDate = await this.fetchErefDate(item.url);
                    if (detailedDate) {
                        item.date = detailedDate;
                        // Update ID with new date
                        item.id = this.generateId(item.title, detailedDate);
                    }

                    // Rate limiting - 200ms delay between requests
                    await this._sleep(200);
                }
            }
        }

        // Sort by year (newest first), then by erefId (newest first) within same year
        items.sort((a, b) => {
            // Extract year from date
            const yearA = a.date.includes('.') ?
                parseInt(a.date.split('.')[2], 10) :
                parseInt(a.date, 10);
            const yearB = b.date.includes('.') ?
                parseInt(b.date.split('.')[2], 10) :
                parseInt(b.date, 10);

            // Primary sort: year descending
            if (yearA !== yearB) {
                return yearB - yearA;
            }

            // Secondary sort: erefId descending (higher ID = newer)
            return (b.erefId || 0) - (a.erefId || 0);
        });

        return items;
    },

    /**
     * Extract team members from members page
     * @param {Document} doc - Parsed document
     * @returns {Array} Member items organized by pillar
     */
    extractMembersFromPage(doc) {
        const items = [];
        const content = doc.querySelector('#content') || doc.body;

        // Members are typically organized by pillars/sections
        let currentPillar = '';

        // Known pillar names
        const pillarPatterns = [
            'AI Technology',
            'AI for Life Science',
            'AI for Physical Science',
            'AI for Humanities',
            'AI & Society',
            'Coordination',
            'Administration'
        ];

        const allElements = content.querySelectorAll('h2, h3, h4, div, p, li, a, article');

        allElements.forEach(el => {
            const text = this._cleanText(el.textContent);

            // Check if this is a pillar header
            for (const pillar of pillarPatterns) {
                if (text.includes(pillar) && (el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4')) {
                    currentPillar = pillar;
                    return;
                }
            }

            // Look for member entries - typically have name and optional link
            const link = el.tagName === 'A' ? el : el.querySelector('a[href]');
            if (!link) return;

            const href = link.getAttribute('href') || '';
            const name = this._cleanText(link.textContent);

            // Filter out navigation and short names
            if (name.length < 3 || name.length > 100) return;
            if (this.NAV_ITEMS.has(name)) return;
            if (href.startsWith('#') || href.startsWith('javascript:')) return;
            if (href.includes('mailto:')) return;

            // Check if it looks like a person's name (contains at least one space or is a single word professor)
            const looksLikeName = name.includes(' ') ||
                                  name.toLowerCase().includes('prof') ||
                                  name.toLowerCase().includes('dr.');

            // Also accept links to uni-bayreuth.de profiles
            const isProfileLink = href.includes('uni-bayreuth.de') &&
                                  (href.includes('/person/') || href.includes('/members/') || href.includes('/staff/'));

            if (!looksLikeName && !isProfileLink) return;

            let absoluteUrl;
            try {
                absoluteUrl = href.startsWith('http') ? href : new URL(href, this.MEMBERS_URL).href;
            } catch {
                absoluteUrl = this.MEMBERS_URL;
            }

            const id = this.generateId(name, currentPillar || 'member');

            // Avoid duplicates
            if (!items.some(i => i.id === id || i.title === name)) {
                items.push({
                    id,
                    title: name,
                    date: new Date().getFullYear().toString(),
                    summary: '',
                    url: absoluteUrl,
                    category: 'member',
                    pillar: currentPillar
                });
            }
        });

        return items;
    },

    /**
     * Scrape team members
     * @returns {Promise<Array>} Member items
     */
    async scrapeMembers() {
        const html = await this.fetchPage(this.MEMBERS_URL);
        if (!html) return [];

        const doc = this.parseHTML(html);
        const items = this.extractMembersFromPage(doc);

        return items;
    },

    /**
     * Extract research projects from projects page
     * @param {Document} doc - Parsed document
     * @returns {Array} Project items organized by pillar
     */
    extractProjectsFromPage(doc) {
        const items = [];
        const content = doc.querySelector('#content') || doc.body;

        let currentPillar = '';

        // Known pillar names
        const pillarPatterns = [
            'AI Technology',
            'AI for Life Science',
            'AI for Physical Science',
            'AI for Humanities',
            'AI & Society'
        ];

        // Projects might be in various structures: divs, articles, lists, or accordion
        const allElements = content.querySelectorAll('h2, h3, h4, div, article, li, dt, dd, p');

        allElements.forEach(el => {
            const text = this._cleanText(el.textContent);

            // Check if this is a pillar header
            for (const pillar of pillarPatterns) {
                if (text.includes(pillar) && (el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'H4')) {
                    currentPillar = pillar;
                    return;
                }
            }

            // Look for project entries
            const link = el.querySelector('a[href]');
            if (!link) return;

            const href = link.getAttribute('href') || '';
            const title = this._cleanText(link.textContent);

            // Filter criteria
            if (title.length < 5 || title.length > 300) return;
            if (this.NAV_ITEMS.has(title)) return;
            if (href.startsWith('#') || href.startsWith('javascript:')) return;

            // Only include internal project links or research-related links
            const isProjectLink = href.includes('/projects/') ||
                                  href.includes('/research/') ||
                                  href.includes('uni-bayreuth.de');

            if (!isProjectLink) return;

            let absoluteUrl;
            try {
                absoluteUrl = href.startsWith('http') ? href : new URL(href, this.PROJECTS_URL).href;
            } catch {
                absoluteUrl = this.PROJECTS_URL;
            }

            // Try to extract description from surrounding text
            let summary = '';
            const parentText = this._cleanText(el.textContent);
            if (parentText.length > title.length + 20) {
                const afterTitle = parentText.split(title)[1];
                if (afterTitle) {
                    summary = afterTitle.slice(0, 200).trim();
                    if (summary.length > 150) summary = summary.slice(0, 147) + '...';
                }
            }

            const id = this.generateId(title, currentPillar || 'project');

            // Avoid duplicates
            if (!items.some(i => i.id === id || i.title === title)) {
                items.push({
                    id,
                    title,
                    date: 'Ongoing',
                    summary,
                    url: absoluteUrl,
                    category: 'project',
                    pillar: currentPillar
                });
            }
        });

        return items;
    },

    /**
     * Scrape research projects
     * @returns {Promise<Array>} Project items
     */
    async scrapeProjects() {
        const html = await this.fetchPage(this.PROJECTS_URL);
        if (!html) return [];

        const doc = this.parseHTML(html);
        const items = this.extractProjectsFromPage(doc);

        return items;
    },

    /**
     * Scrape a category with retry logic
     * @param {string} category - Category key
     * @param {Function} scrapeFn - Scrape function
     * @param {number} maxRetries - Maximum retry attempts
     * @returns {Promise<{data: Array, status: string, source: string, error: string|null}>}
     */
    async scrapeWithRetry(category, scrapeFn, maxRetries = 3) {
        ScrapeLogger.log(category, 'start', { maxRetries });

        // Update dashboard if available
        if (window.ScrapeDashboard) {
            ScrapeDashboard.updateStatus(category, 'loading');
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await scrapeFn();

                if (result && result.length > 0) {
                    ScrapeLogger.log(category, 'success', { count: result.length, attempt });

                    if (window.ScrapeDashboard) {
                        ScrapeDashboard.updateStatus(category, 'success', result.length);
                    }

                    return { data: result, status: 'success', source: 'fresh', error: null };
                }

                // Empty result - might be scraping issue
                ScrapeLogger.log(category, 'retry', { attempt, reason: 'empty result' });

            } catch (error) {
                ScrapeLogger.log(category, 'retry', { attempt, error: error.message });

                if (attempt === maxRetries) {
                    // Try cache as last resort
                    const cached = this.getCachedCategory(category);
                    if (cached && cached.length > 0) {
                        ScrapeLogger.log(category, 'cached', { count: cached.length });

                        if (window.ScrapeDashboard) {
                            ScrapeDashboard.updateStatus(category, 'cached', cached.length);
                        }

                        return { data: cached, status: 'cached', source: 'localStorage', error: null };
                    }

                    ScrapeLogger.log(category, 'failed', { error: error.message });

                    if (window.ScrapeDashboard) {
                        ScrapeDashboard.updateStatus(category, 'failed', 0);
                        ScrapeDashboard.showError(category, error.message);
                    }

                    return { data: [], status: 'failed', source: null, error: error.message };
                }
            }

            // Wait before retry
            await this._sleep(500 * attempt);
        }

        // Should not reach here, but handle gracefully
        return { data: [], status: 'failed', source: null, error: 'Unknown error' };
    },

    /**
     * Get cached data for a specific category
     * @param {string} category - Category key
     * @returns {Array|null} Cached items or null
     */
    getCachedCategory(category) {
        try {
            const cached = StorageManager.getCachedContent();
            return cached[category] || null;
        } catch (e) {
            return null;
        }
    },

    /**
     * Scrape all content
     * @param {boolean} useCache - Whether to use cached content
     * @param {Function} onProgress - Optional progress callback
     * @returns {Promise<Object>} All scraped content
     */
    async scrapeAll(useCache = true, onProgress = null) {
        // #region agent log
        this._debugLog('scraper.js:scrapeAll:entry','scrapeAll called',{useCache,cacheValid:StorageManager.isCacheValid()},'H2');
        // #endregion

        ScrapeLogger.log('system', 'start', { useCache, timestamp: new Date().toISOString() });

        // Check cache first
        if (useCache && StorageManager.isCacheValid()) {
            const cached = StorageManager.getCachedContent();
            // #region agent log
            this._debugLog('scraper.js:scrapeAll:usingCache','Using cached content',{newsCount:cached.news?.length,eventsCount:cached.events?.length,lecturesCount:cached.lectures?.length,publicationsCount:cached.publications?.length,membersCount:cached.members?.length,projectsCount:cached.projects?.length,cachedAt:cached.cachedAt},'H2');
            // #endregion
            console.log('Using cached content');
            ScrapeLogger.log('system', 'cached', { cachedAt: cached.cachedAt });

            if (onProgress) onProgress({ phase: 'cache', percent: 100, message: 'Using cached content' });

            // Update dashboard with cached status
            if (window.ScrapeDashboard) {
                const categories = ['news', 'events', 'lectures', 'publications', 'members', 'projects'];
                categories.forEach(cat => {
                    const count = cached[cat]?.length || 0;
                    ScrapeDashboard.updateStatus(cat, count > 0 ? 'cached' : 'failed', count);
                });
            }

            return cached;
        }

        console.log('Scraping fresh content...');
        ScrapeLogger.log('system', 'start', { mode: 'fresh' });

        // Update proxy health first
        if (window.ScrapeDashboard) {
            const healthSummary = ProxyHealthChecker.getHealthSummary(this.CORS_PROXIES);
            ScrapeDashboard.updateProxyHealth(healthSummary.healthy, healthSummary.total);
        }

        const results = { news: [], events: [], lectures: [], publications: [], members: [], projects: [] };
        const phases = [
            { key: 'news', label: 'News', fn: () => this.scrapeNews() },
            { key: 'events', label: 'Events', fn: () => this.scrapeEvents() },
            { key: 'lectures', label: 'Lectures', fn: () => this.scrapeLectures() },
            { key: 'publications', label: 'Publications', fn: () => this.scrapePublications() },
            { key: 'members', label: 'Members', fn: () => this.scrapeMembers() },
            { key: 'projects', label: 'Projects', fn: () => this.scrapeProjects() }
        ];

        // Initialize dashboard with loading states
        if (window.ScrapeDashboard) {
            phases.forEach(phase => {
                ScrapeDashboard.updateStatus(phase.key, 'loading');
            });
        }

        // Fetch all categories in parallel with retry logic
        if (onProgress) {
            onProgress({ phase: 'all', percent: 0, message: 'Fetching all content...' });
        }

        const promises = phases.map(async (phase, index) => {
            const result = await this.scrapeWithRetry(phase.key, phase.fn, 3);

            // Update progress
            const percent = Math.round(((index + 1) / phases.length) * 100);
            if (onProgress) {
                onProgress({
                    phase: phase.key,
                    percent,
                    message: `Fetching ${phase.label}...`,
                    status: result.status
                });
            }

            if (window.ScrapeDashboard) {
                ScrapeDashboard.updateProgress(percent, `Fetching ${phase.label}...`);
            }

            return { key: phase.key, ...result };
        });

        const settled = await Promise.all(promises);
        for (const result of settled) {
            results[result.key] = result.data;
        }

        // #region agent log
        this._debugLog('scraper.js:scrapeAll:freshResult','Fresh scrape completed',{newsCount:results.news.length,eventsCount:results.events.length,lecturesCount:results.lectures.length,publicationsCount:results.publications.length,membersCount:results.members.length,projectsCount:results.projects.length},'H3,H4');
        // #endregion

        // Cache the results
        StorageManager.setCachedContent(results);

        const total = results.news.length + results.events.length + results.lectures.length +
                      results.publications.length + results.members.length + results.projects.length;

        ScrapeLogger.log('system', 'success', { totalItems: total });

        if (onProgress) onProgress({ phase: 'done', percent: 100, message: `Found ${total} items` });

        if (window.ScrapeDashboard) {
            ScrapeDashboard.updateProgress(100, `Found ${total} items`);
        }

        console.log(`Scraped: ${results.news.length} news, ${results.events.length} events, ${results.lectures.length} lectures, ${results.publications.length} publications, ${results.members.length} members, ${results.projects.length} projects`);
        return results;
    },

    /**
     * Retry scraping a single category
     * @param {string} category - Category to retry
     * @returns {Promise<Object>} Result with status
     */
    async retryCategory(category) {
        const fnMap = {
            news: () => this.scrapeNews(),
            events: () => this.scrapeEvents(),
            lectures: () => this.scrapeLectures(),
            publications: () => this.scrapePublications(),
            members: () => this.scrapeMembers(),
            projects: () => this.scrapeProjects()
        };

        if (!fnMap[category]) {
            return { data: [], status: 'failed', error: 'Unknown category' };
        }

        const result = await this.scrapeWithRetry(category, fnMap[category], 3);

        // Update cache with new data if successful
        if (result.status === 'success') {
            const cached = StorageManager.getCachedContent();
            cached[category] = result.data;
            cached.cachedAt = new Date().toISOString();
            StorageManager.setCachedContent(cached);
        }

        return result;
    },

    /**
     * Get new items (not seen before)
     * @param {Array} items - All items
     * @returns {Array} New items only
     */
    getNewItems(items) {
        return items.filter(item => !StorageManager.isItemSeen(item.id));
    },

    /**
     * Get all items as flat array
     * @param {Object} content - Content object with news, events, lectures, publications, members, projects
     * @returns {Array} All items
     */
    getAllItems(content) {
        // #region agent log
        this._debugLog('scraper.js:getAllItems:entry','getAllItems called',{contentType:typeof content,contentKeys:content?Object.keys(content):[],newsLen:content?.news?.length,eventsLen:content?.events?.length,lecturesLen:content?.lectures?.length,publicationsLen:content?.publications?.length,membersLen:content?.members?.length,projectsLen:content?.projects?.length},'H4');
        // #endregion
        const result = [
            ...(content.news || []),
            ...(content.events || []),
            ...(content.lectures || []),
            ...(content.publications || []),
            ...(content.members || []),
            ...(content.projects || [])
        ];
        // #region agent log
        this._debugLog('scraper.js:getAllItems:exit','getAllItems returning',{totalItems:result.length},'H4');
        // #endregion
        return result;
    }
};

// Export for use in other modules
window.RAIS2Scraper = RAIS2Scraper;
