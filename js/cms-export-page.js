/**
 * CMS Export Page Module
 * Handles all functionality for the CMS Export page
 */

const CMSExportPage = {
    // Cached content items
    allItems: [],

    // Google OAuth state
    googleAccessToken: null,
    googleUserEmail: null,

    // Raw sheet data for raw view
    rawSheetData: null,
    currentView: 'cms', // 'cms' or 'raw'
    currentCMSFields: null,

    // Google OAuth Client ID (you'll need to replace this with your own)
    // Get one at: https://console.cloud.google.com/apis/credentials
    GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

    /**
     * Initialize the CMS Export page
     */
    init() {
        console.log('[CMSExportPage] Initializing...');

        this.setupSourceTabs();
        this.setupImportMethods();
        this.setupAuthToggle();
        this.setupViewToggle();
        this.setupEventListeners();
        this.setupSheetsHandlers();
        this.loadContent();

        // Initialize CMS Generator
        if (window.CMSGenerator) {
            CMSGenerator.init();
        }
    },

    /**
     * Setup auth method toggle (OAuth vs API Key)
     */
    setupAuthToggle() {
        const oauthBtn = document.getElementById('btnAuthOAuth');
        const apiKeyBtn = document.getElementById('btnAuthApiKey');
        const oauthMethod = document.getElementById('sheetsOAuthMethod');
        const apiKeyMethod = document.getElementById('sheetsApiKeyMethod');

        if (oauthBtn && apiKeyBtn) {
            oauthBtn.addEventListener('click', () => {
                oauthBtn.classList.add('active');
                apiKeyBtn.classList.remove('active');
                if (oauthMethod) oauthMethod.style.display = 'block';
                if (apiKeyMethod) apiKeyMethod.style.display = 'none';
            });

            apiKeyBtn.addEventListener('click', () => {
                apiKeyBtn.classList.add('active');
                oauthBtn.classList.remove('active');
                if (apiKeyMethod) apiKeyMethod.style.display = 'block';
                if (oauthMethod) oauthMethod.style.display = 'none';
            });
        }
    },

    /**
     * Setup view toggle (CMS View vs Raw Data)
     */
    setupViewToggle() {
        const viewToggle = document.getElementById('cmsViewToggle');
        if (!viewToggle) return;

        viewToggle.addEventListener('click', (e) => {
            const btn = e.target.closest('.cms-view-btn');
            if (!btn) return;

            const view = btn.dataset.view;
            if (view === this.currentView) return;

            // Update buttons
            viewToggle.querySelectorAll('.cms-view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            this.currentView = view;

            // Render appropriate view
            if (view === 'raw' && this.rawSheetData) {
                this.renderRawData(this.rawSheetData);
            } else if (view === 'cms' && this.currentCMSFields) {
                this.renderFields(this.currentCMSFields);
            }
        });
    },

    /**
     * Render raw sheet data in original order
     */
    renderRawData(data) {
        const container = document.getElementById('cmsFieldsContainer');
        if (!container || !data || !data.headers || !data.firstRow) {
            return;
        }

        let html = '<div class="cms-raw-data-list">';

        data.headers.forEach((header, index) => {
            const value = data.firstRow[index] || '';
            html += `
                <div class="cms-raw-field">
                    <div class="cms-raw-field-header">
                        <span class="cms-raw-field-label">${this.escapeHtml(header)}</span>
                        <button class="cms-copy-btn cms-raw-copy-btn" data-index="${index}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                            <span class="copy-text">Copy</span>
                            <span class="copied-text">Copied!</span>
                        </button>
                    </div>
                    <div class="cms-raw-field-value">${value ? this.escapeHtml(value) : '<span style="color: var(--text-tertiary); font-style: italic;">Empty</span>'}</div>
                </div>
            `;
        });

        html += '</div>';

        // Add Copy All button
        html += `
            <button class="cms-copy-all-btn" id="btnCopyAllRaw">
                Copy All Fields
            </button>
        `;

        container.innerHTML = html;

        // Add event listeners for copy buttons
        container.querySelectorAll('.cms-raw-copy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const index = parseInt(btn.dataset.index);
                const value = this.rawSheetData.firstRow[index] || '';
                await this.copyToClipboard(value, btn);
            });
        });

        // Add event listener for Copy All button
        const copyAllBtn = document.getElementById('btnCopyAllRaw');
        if (copyAllBtn) {
            copyAllBtn.addEventListener('click', () => this.copyAllRawData());
        }
    },

    /**
     * Copy text to clipboard with button feedback
     */
    async copyToClipboard(text, btn) {
        try {
            await navigator.clipboard.writeText(text);
            if (btn) {
                btn.classList.add('copied');
                setTimeout(() => btn.classList.remove('copied'), 1500);
            }
            App.showToast('Copied to clipboard!', 'success');
            return true;
        } catch (error) {
            // Fallback for older browsers
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                if (btn) {
                    btn.classList.add('copied');
                    setTimeout(() => btn.classList.remove('copied'), 1500);
                }
                App.showToast('Copied to clipboard!', 'success');
                return true;
            } catch (fallbackError) {
                console.error('Copy failed:', fallbackError);
                App.showToast('Failed to copy', 'error');
                return false;
            }
        }
    },

    /**
     * Copy all raw data fields
     */
    async copyAllRawData() {
        if (!this.rawSheetData) return;

        const lines = [];
        this.rawSheetData.headers.forEach((header, index) => {
            const value = this.rawSheetData.firstRow[index] || '';
            lines.push(`${header}: ${value}`);
        });

        const text = lines.join('\n');
        const btn = document.getElementById('btnCopyAllRaw');
        await this.copyToClipboard(text, btn);
    },

    /**
     * Setup Google Sheets fetch handlers
     */
    setupSheetsHandlers() {
        // API Key method
        const btnFetchSheets = document.getElementById('btnFetchSheets');
        if (btnFetchSheets) {
            btnFetchSheets.addEventListener('click', () => this.fetchSheetsWithApiKey());
        }

        // OAuth method
        const btnFetchSheetsOAuth = document.getElementById('btnFetchSheetsOAuth');
        if (btnFetchSheetsOAuth) {
            btnFetchSheetsOAuth.addEventListener('click', () => this.fetchSheetsWithOAuth());
        }

        // Sign out button
        const btnGoogleSignOut = document.getElementById('btnGoogleSignOut');
        if (btnGoogleSignOut) {
            btnGoogleSignOut.addEventListener('click', () => this.googleSignOut());
        }
    },

    /**
     * Extract Sheet ID from URL or ID string
     */
    extractSheetId(input) {
        if (!input) return null;

        // If it's a full URL, extract the ID
        const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (urlMatch) {
            return urlMatch[1];
        }

        // Otherwise assume it's already an ID
        return input.trim();
    },

    /**
     * Fetch sheets data using API Key
     */
    async fetchSheetsWithApiKey() {
        const sheetIdInput = document.getElementById('sheetsId');
        const apiKeyInput = document.getElementById('sheetsApiKey');
        const rangeInput = document.getElementById('sheetsRange');
        const btn = document.getElementById('btnFetchSheets');

        const sheetId = this.extractSheetId(sheetIdInput?.value);
        const apiKey = apiKeyInput?.value?.trim();
        const range = rangeInput?.value?.trim() || 'Sheet1';

        if (!sheetId) {
            App.showToast('Please enter a Google Sheet ID', 'error');
            return;
        }

        if (!apiKey) {
            App.showToast('Please enter an API Key', 'error');
            return;
        }

        btn?.classList.add('loading');

        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to fetch sheet data');
            }

            const data = await response.json();
            this.processSheetData(data);
            App.showToast('Sheet data fetched successfully!', 'success');

        } catch (error) {
            console.error('[CMSExportPage] Sheets API error:', error);
            App.showToast(error.message || 'Failed to fetch sheet data', 'error');
        } finally {
            btn?.classList.remove('loading');
        }
    },

    /**
     * Fetch sheets data using OAuth
     */
    async fetchSheetsWithOAuth() {
        const sheetIdInput = document.getElementById('sheetsIdOAuth');
        const rangeInput = document.getElementById('sheetsRangeOAuth');
        const btn = document.getElementById('btnFetchSheetsOAuth');
        const btnText = document.getElementById('oauthBtnText');

        const sheetId = this.extractSheetId(sheetIdInput?.value);
        const range = rangeInput?.value?.trim() || 'Sheet1';

        if (!sheetId) {
            App.showToast('Please enter a Google Sheet ID or URL', 'error');
            return;
        }

        btn?.classList.add('loading');

        try {
            // If we don't have a token, get one
            if (!this.googleAccessToken) {
                await this.googleSignIn();
            }

            // Fetch the sheet data
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.googleAccessToken}`
                }
            });

            if (response.status === 401) {
                // Token expired, sign in again
                this.googleAccessToken = null;
                await this.googleSignIn();
                return this.fetchSheetsWithOAuth();
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to fetch sheet data');
            }

            const data = await response.json();
            this.processSheetData(data);
            App.showToast('Sheet data fetched successfully!', 'success');

        } catch (error) {
            console.error('[CMSExportPage] OAuth fetch error:', error);
            if (error.message !== 'Sign in cancelled') {
                App.showToast(error.message || 'Failed to fetch sheet data', 'error');
            }
        } finally {
            btn?.classList.remove('loading');
        }
    },

    /**
     * Sign in with Google OAuth
     */
    googleSignIn() {
        return new Promise((resolve, reject) => {
            if (typeof google === 'undefined' || !google.accounts) {
                reject(new Error('Google Identity Services not loaded. Please refresh the page.'));
                return;
            }

            const client = google.accounts.oauth2.initTokenClient({
                client_id: this.GOOGLE_CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
                callback: (response) => {
                    if (response.error) {
                        reject(new Error(response.error_description || 'Sign in failed'));
                        return;
                    }

                    this.googleAccessToken = response.access_token;
                    this.updateGoogleUI(true);
                    resolve(response.access_token);
                },
            });

            client.requestAccessToken();
        });
    },

    /**
     * Sign out from Google
     */
    googleSignOut() {
        if (this.googleAccessToken && google?.accounts?.oauth2) {
            google.accounts.oauth2.revoke(this.googleAccessToken);
        }
        this.googleAccessToken = null;
        this.googleUserEmail = null;
        this.updateGoogleUI(false);
        App.showToast('Signed out from Google', 'success');
    },

    /**
     * Update Google sign-in UI
     */
    updateGoogleUI(signedIn) {
        const userInfo = document.getElementById('googleUserInfo');
        const userEmail = document.getElementById('googleUserEmail');
        const btnText = document.getElementById('oauthBtnText');

        if (signedIn) {
            if (userInfo) userInfo.style.display = 'flex';
            if (userEmail) userEmail.textContent = 'Signed in with Google';
            if (btnText) btnText.textContent = 'Fetch Data';
        } else {
            if (userInfo) userInfo.style.display = 'none';
            if (btnText) btnText.textContent = 'Sign In & Fetch Data';
        }
    },

    /**
     * Find a field value by searching for keywords in headers
     */
    findFieldByKeywords(item, keywords, exclude = []) {
        const headers = Object.keys(item);
        for (const keyword of keywords) {
            for (const header of headers) {
                const headerLower = header.toLowerCase();
                // Skip excluded keywords
                if (exclude.some(ex => headerLower.includes(ex.toLowerCase()))) continue;
                if (headerLower.includes(keyword.toLowerCase())) {
                    return item[header];
                }
            }
        }
        return '';
    },

    /**
     * Process sheet data and generate CMS fields
     */
    processSheetData(data) {
        if (!data.values || data.values.length < 2) {
            App.showToast('Sheet is empty or has no data rows', 'error');
            return;
        }

        const headers = data.values[0].map(h => String(h).trim());
        const rows = data.values.slice(1);

        console.log('[CMSExportPage] Sheet headers:', headers);
        console.log('[CMSExportPage] Sheet rows:', rows.length);

        // Convert rows to objects
        const items = rows.map((row, index) => {
            const obj = {};
            headers.forEach((header, i) => {
                obj[header] = row[i] || '';
            });
            return obj;
        });

        // Store all items for potential batch processing
        this.sheetsItems = items;

        // Smart field mapping using keyword search
        const firstItem = items[0];

        // Find title - look for "title", "name", "event", "talk" but exclude "timestamp"
        const title = this.findFieldByKeywords(firstItem, ['title', 'name', 'event', 'talk', 'news'], ['timestamp', 'email', 'contact']);

        // Find description - look for "description", "summary", "about", "brief"
        const summary = this.findFieldByKeywords(firstItem, ['description', 'summary', 'about', 'brief', 'details']);

        // Find date - look for "date", "time", "when" but exclude "timestamp"
        const date = this.findFieldByKeywords(firstItem, ['date and time', 'event date', 'date', 'when'], ['timestamp']);

        // Find location - look for "location", "place", "venue", "platform", "where"
        const location = this.findFieldByKeywords(firstItem, ['location', 'place', 'venue', 'platform', 'where', 'address']);

        // Find category/type
        const category = this.findFieldByKeywords(firstItem, ['type', 'category', 'kind']);

        // Find speaker - look for "speaker", "presenter", "host"
        const speaker = this.findFieldByKeywords(firstItem, ['speaker', 'presenter', 'host', 'lecturer']);

        // Find URL/Link
        const url = this.findFieldByKeywords(firstItem, ['url', 'link', 'website'], ['zoom']);

        // Find email
        const email = this.findFieldByKeywords(firstItem, ['email', 'contact']);

        // Find duration
        const duration = this.findFieldByKeywords(firstItem, ['duration', 'length', 'how long']);

        // Find tags/topics
        const tags = this.findFieldByKeywords(firstItem, ['tags', 'topics', 'category', 'keywords']);

        const item = {
            id: 'sheets-import-' + Date.now(),
            title: title || Object.values(firstItem)[1] || 'Imported Item',
            summary: summary || '',
            date: date || new Date().toLocaleDateString('de-DE'),
            url: url || '',
            speaker: speaker || '',
            location: location || '',
            time: '',
            duration: duration || '',
            email: email || '',
            tags: tags || '',
            category: category?.toLowerCase().includes('event') ? 'event' :
                     category?.toLowerCase().includes('lecture') ? 'lecture' :
                     category?.toLowerCase().includes('news') ? 'news' : 'event'
        };

        console.log('[CMSExportPage] Mapped item:', item);

        // Store raw data for raw view
        this.rawSheetData = {
            headers: headers,
            firstRow: rows[0],
            allRows: rows
        };

        // Show the view toggle
        const viewToggle = document.getElementById('cmsViewToggle');
        if (viewToggle) {
            viewToggle.style.display = 'flex';
        }

        // Reset to CMS view
        this.currentView = 'cms';
        const viewBtns = document.querySelectorAll('.cms-view-btn');
        viewBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === 'cms');
        });

        // Generate fields from first item
        this.generateFields(item);

        if (items.length > 1) {
            App.showToast(`Loaded ${items.length} rows. Showing first item.`, 'success');
        }
    },

    /**
     * Load content from cache or scraper
     */
    async loadContent() {
        try {
            // Try to get cached content first
            const cached = StorageManager.getCachedContent();

            if (cached && cached.news && cached.news.length > 0) {
                this.allItems = [
                    ...cached.news.map(item => ({ ...item, category: 'news' })),
                    ...cached.events.map(item => ({ ...item, category: 'event' })),
                    ...cached.lectures.map(item => ({ ...item, category: 'lecture' }))
                ];
                this.populateItemSelect();
            } else {
                // Show loading state
                const select = document.getElementById('cmsItemSelect');
                if (select) {
                    select.innerHTML = '<option value="">Loading content...</option>';
                }

                // Scrape fresh content
                if (window.RAIS2Scraper) {
                    const content = await RAIS2Scraper.scrapeAll(true);
                    this.allItems = [
                        ...content.news.map(item => ({ ...item, category: 'news' })),
                        ...content.events.map(item => ({ ...item, category: 'event' })),
                        ...content.lectures.map(item => ({ ...item, category: 'lecture' }))
                    ];
                    this.populateItemSelect();
                }
            }
        } catch (error) {
            console.error('[CMSExportPage] Failed to load content:', error);
            App.showToast('Failed to load content', 'error');
        }
    },

    /**
     * Populate the item select dropdown
     */
    populateItemSelect() {
        const select = document.getElementById('cmsItemSelect');
        if (!select) return;

        // Group items by category
        const groups = {
            news: this.allItems.filter(i => i.category === 'news'),
            event: this.allItems.filter(i => i.category === 'event'),
            lecture: this.allItems.filter(i => i.category === 'lecture')
        };

        let html = '<option value="">Choose an item...</option>';

        if (groups.news.length > 0) {
            html += '<optgroup label="News">';
            groups.news.forEach(item => {
                html += `<option value="${item.id}">${this.escapeHtml(item.title)}</option>`;
            });
            html += '</optgroup>';
        }

        if (groups.event.length > 0) {
            html += '<optgroup label="Events">';
            groups.event.forEach(item => {
                html += `<option value="${item.id}">${this.escapeHtml(item.title)}</option>`;
            });
            html += '</optgroup>';
        }

        if (groups.lecture.length > 0) {
            html += '<optgroup label="Lectures">';
            groups.lecture.forEach(item => {
                html += `<option value="${item.id}">${this.escapeHtml(item.title)}</option>`;
            });
            html += '</optgroup>';
        }

        select.innerHTML = html;
    },

    /**
     * Setup source tab switching
     */
    setupSourceTabs() {
        document.querySelectorAll('.cms-source-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.cms-source-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.switchSource(tab.dataset.source);
            });
        });
    },

    /**
     * Switch between sources
     */
    switchSource(source) {
        document.getElementById('cmsNewsletterSource').style.display = source === 'newsletter' ? 'block' : 'none';
        document.getElementById('cmsFormsSource').style.display = source === 'forms' ? 'block' : 'none';
        document.getElementById('cmsManualSource').style.display = source === 'manual' ? 'block' : 'none';
        const csvSource = document.getElementById('cmsCsvSource');
        if (csvSource) csvSource.style.display = source === 'csv' ? 'block' : 'none';

        if (source === 'csv') {
            this.loadCsvItems();
        }

        // Reset fields when switching
        this.showEmptyState();
    },

    /**
     * Load CSV items into the CMS export CSV source panel
     */
    loadCsvItems() {
        const csvData = StorageManager.getCSVItems();
        const items = csvData.items || [];
        const countEl = document.getElementById('cmsCsvItemCount');
        if (countEl) countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;
        this.populateCsvSelect(items);
    },

    /**
     * Populate the CSV item select dropdown grouped by category
     */
    populateCsvSelect(items) {
        const select = document.getElementById('cmsCsvItemSelect');
        if (!select) return;

        const groups = {
            lecture: items.filter(i => i.category === 'lecture'),
            event: items.filter(i => i.category === 'event'),
            news: items.filter(i => i.category === 'news')
        };

        let html = '<option value="">Choose an item...</option>';

        if (groups.lecture.length > 0) {
            html += '<optgroup label="Lectures">';
            groups.lecture.forEach(item => {
                html += `<option value="${item.id}">${this.escapeHtml(item.title)}</option>`;
            });
            html += '</optgroup>';
        }

        if (groups.event.length > 0) {
            html += '<optgroup label="Events">';
            groups.event.forEach(item => {
                html += `<option value="${item.id}">${this.escapeHtml(item.title)}</option>`;
            });
            html += '</optgroup>';
        }

        if (groups.news.length > 0) {
            html += '<optgroup label="News">';
            groups.news.forEach(item => {
                html += `<option value="${item.id}">${this.escapeHtml(item.title)}</option>`;
            });
            html += '</optgroup>';
        }

        select.innerHTML = html;
    },

    /**
     * Setup import method tabs
     */
    setupImportMethods() {
        document.querySelectorAll('.cms-import-method-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cms-import-method-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchImportMethod(btn.dataset.method);
            });
        });
    },

    /**
     * Switch import method
     */
    switchImportMethod(method) {
        document.getElementById('cmsImportCSV').style.display = method === 'csv' ? 'block' : 'none';
        document.getElementById('cmsImportJSON').style.display = method === 'json' ? 'block' : 'none';
        document.getElementById('cmsImportSheets').style.display = method === 'sheets' ? 'block' : 'none';
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Item select
        const itemSelect = document.getElementById('cmsItemSelect');
        if (itemSelect) {
            itemSelect.addEventListener('change', (e) => {
                const itemId = e.target.value;
                if (itemId) {
                    const item = this.allItems.find(i => i.id === itemId);
                    if (item) {
                        this.generateFields(item);
                    }
                } else {
                    this.showEmptyState();
                }
            });
        }

        // CSV upload
        const csvDropArea = document.getElementById('csvDropArea');
        const csvFileInput = document.getElementById('csvFileInput');
        if (csvDropArea && csvFileInput) {
            csvDropArea.addEventListener('click', () => csvFileInput.click());
            csvDropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                csvDropArea.classList.add('dragover');
            });
            csvDropArea.addEventListener('dragleave', () => {
                csvDropArea.classList.remove('dragover');
            });
            csvDropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                csvDropArea.classList.remove('dragover');
                const file = e.dataTransfer.files[0];
                if (file && file.name.endsWith('.csv')) {
                    this.handleCSVFile(file);
                }
            });
            csvFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleCSVFile(file);
                }
            });
        }

        // JSON parse button
        const btnParseJson = document.getElementById('btnParseJson');
        if (btnParseJson) {
            btnParseJson.addEventListener('click', () => this.handleJSONParse());
        }

        // Manual entry button
        const btnGenerateManual = document.getElementById('btnGenerateManual');
        if (btnGenerateManual) {
            btnGenerateManual.addEventListener('click', () => this.handleManualEntry());
        }

        // CSV Items source select
        const cmsCsvSelect = document.getElementById('cmsCsvItemSelect');
        if (cmsCsvSelect) {
            cmsCsvSelect.addEventListener('change', (e) => {
                const itemId = e.target.value;
                if (itemId) {
                    const csvData = StorageManager.getCSVItems();
                    const item = csvData.items.find(i => i.id === itemId);
                    if (item) {
                        this.generateFields(item);
                        this.showGeneratedTextSection(item);
                    }
                } else {
                    this.showEmptyState();
                }
            });
        }
    },

    /**
     * Show empty state
     */
    showEmptyState() {
        const container = document.getElementById('cmsFieldsContainer');
        const preview = document.getElementById('cmsPreviewSection');

        const genTextSection = document.getElementById('cmsGeneratedTextSection');
        if (genTextSection) genTextSection.remove();

        if (container) {
            container.innerHTML = `
                <div class="cms-empty-state">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
                    <p>Select an item to generate CMS fields</p>
                </div>
            `;
        }

        if (preview) {
            preview.style.display = 'none';
        }
    },

    /**
     * Generate CMS fields for an item
     */
    generateFields(item) {
        if (!window.CMSGenerator) {
            App.showToast('CMS Generator not available', 'error');
            return;
        }

        try {
            const fields = CMSGenerator.generateFromItem(item);
            this.currentCMSFields = fields; // Store for view toggle
            this.renderFields(fields);
            this.renderPreview(fields);
        } catch (error) {
            console.error('[CMSExportPage] Generation error:', error);
            App.showToast('Failed to generate CMS fields: ' + error.message, 'error');
        }
    },

    /**
     * Render CMS fields
     */
    renderFields(fields) {
        const container = document.getElementById('cmsFieldsContainer');
        if (!container) return;

        const schema = CMSGenerator.FIELD_SCHEMA;
        const groupNames = {
            allgemein: 'Allgemein',
            content: 'Content',
            flipside: 'Flipside',
            felder: 'Felder'
        };

        let html = '';

        for (const [groupKey, groupFields] of Object.entries(fields)) {
            const groupSchema = schema[groupKey] || {};
            const groupName = groupNames[groupKey] || groupKey;

            html += `
                <details class="cms-field-group" ${groupKey === 'allgemein' || groupKey === 'content' ? 'open' : ''}>
                    <summary>${groupName}</summary>
                    <div class="cms-field-group-content">
            `;

            for (const [fieldKey, value] of Object.entries(groupFields)) {
                const fieldSchema = groupSchema[fieldKey] || {};
                const label = fieldSchema.label || fieldKey;
                const isMultiline = fieldSchema.multiline || fieldKey === 'hauptinhalt';
                const displayValue = this.formatFieldValue(value);
                const isEmpty = !displayValue || displayValue === '';

                html += `
                    <div class="cms-field">
                        <div class="cms-field-header">
                            <span class="cms-field-label">
                                ${label}
                                ${fieldSchema.required ? '<span class="cms-field-required">*</span>' : ''}
                            </span>
                            <button class="cms-copy-btn" onclick="CMSExportPage.copyField(this)" data-value="${this.escapeHtml(String(value || ''))}">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                                <span class="copy-text">Copy</span>
                                <span class="copied-text">Copied!</span>
                            </button>
                        </div>
                        <div class="cms-field-content ${isMultiline ? 'multiline' : ''} ${isEmpty ? 'empty' : ''}">
                            ${isEmpty ? '(empty)' : this.escapeHtml(displayValue)}
                        </div>
                    </div>
                `;
            }

            html += `
                    </div>
                </details>
            `;
        }

        // Add copy all button
        html += `
            <button class="cms-copy-all-btn" onclick="CMSExportPage.copyAllFields()">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="margin-right: 8px;"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                Copy All Fields
            </button>
        `;

        container.innerHTML = html;
    },

    /**
     * Format field value for display
     */
    formatFieldValue(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'Ja' : 'Nein';
        if (Array.isArray(value)) return value.join(', ');
        return String(value);
    },

    /**
     * Copy a single field
     */
    async copyField(button) {
        const value = button.dataset.value;

        try {
            await navigator.clipboard.writeText(value);
            button.classList.add('copied');
            setTimeout(() => {
                button.classList.remove('copied');
            }, 2000);
        } catch (error) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            button.classList.add('copied');
            setTimeout(() => {
                button.classList.remove('copied');
            }, 2000);
        }
    },

    /**
     * Copy all fields
     */
    async copyAllFields() {
        if (!window.CMSGenerator || !CMSGenerator.currentFields) {
            App.showToast('No fields to copy', 'error');
            return;
        }

        try {
            const success = await CMSGenerator.copyAllFields(CMSGenerator.currentFields);
            if (success) {
                App.showToast('All fields copied to clipboard!', 'success');
            }
        } catch (error) {
            App.showToast('Failed to copy fields', 'error');
        }
    },

    /**
     * Render preview
     */
    renderPreview(fields) {
        const previewSection = document.getElementById('cmsPreviewSection');
        const previewFrame = document.getElementById('cmsPreviewFrame');

        if (!previewSection || !previewFrame || !fields) return;

        previewSection.style.display = 'block';
        previewFrame.innerHTML = CMSGenerator.renderPreview(fields);
    },

    /**
     * Handle CSV file upload
     */
    async handleCSVFile(file) {
        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                App.showToast('CSV file is empty or has no data rows', 'error');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const data = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }

            App.showToast(`Parsed ${data.length} rows from CSV`, 'success');
            console.log('[CMSExportPage] CSV Data:', data);

            // Generate fields from first row
            if (data.length > 0) {
                const firstRow = data[0];

                // Store raw data for raw view
                const firstRowValues = headers.map(h => firstRow[h] || '');
                this.rawSheetData = {
                    headers: headers,
                    firstRow: firstRowValues,
                    allRows: data.map(row => headers.map(h => row[h] || ''))
                };

                // Show the view toggle
                const viewToggle = document.getElementById('cmsViewToggle');
                if (viewToggle) {
                    viewToggle.style.display = 'flex';
                }

                // Reset to CMS view
                this.currentView = 'cms';
                const viewBtns = document.querySelectorAll('.cms-view-btn');
                viewBtns.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.view === 'cms');
                });

                // Use smart field mapping
                const title = this.findFieldByKeywords(firstRow, ['title', 'name', 'event', 'talk', 'news'], ['timestamp', 'email', 'contact']);
                const summary = this.findFieldByKeywords(firstRow, ['description', 'summary', 'about', 'brief', 'details']);
                const date = this.findFieldByKeywords(firstRow, ['date and time', 'event date', 'date', 'when'], ['timestamp']);
                const location = this.findFieldByKeywords(firstRow, ['location', 'place', 'venue', 'platform', 'where', 'address']);
                const url = this.findFieldByKeywords(firstRow, ['url', 'link', 'website'], ['zoom']);
                const speaker = this.findFieldByKeywords(firstRow, ['speaker', 'presenter', 'host', 'lecturer']);
                const category = this.findFieldByKeywords(firstRow, ['type', 'category', 'kind']);

                const item = {
                    id: 'csv-import-' + Date.now(),
                    title: title || Object.values(firstRow)[0] || 'Imported Item',
                    summary: summary || '',
                    date: date || new Date().toLocaleDateString('de-DE'),
                    url: url || '',
                    location: location || '',
                    speaker: speaker || '',
                    category: category?.toLowerCase().includes('event') ? 'event' :
                             category?.toLowerCase().includes('lecture') ? 'lecture' :
                             category?.toLowerCase().includes('news') ? 'news' : 'event'
                };
                this.generateFields(item);
            }

        } catch (error) {
            console.error('[CMSExportPage] CSV parse error:', error);
            App.showToast('Failed to parse CSV file', 'error');
        }
    },

    /**
     * Handle JSON parse
     */
    handleJSONParse() {
        const jsonInput = document.getElementById('jsonInput');
        if (!jsonInput) return;

        try {
            const data = JSON.parse(jsonInput.value);
            const item = Array.isArray(data) ? data[0] : data;

            // Store raw data for raw view
            const headers = Object.keys(item);
            const firstRowValues = headers.map(h => String(item[h] || ''));
            this.rawSheetData = {
                headers: headers,
                firstRow: firstRowValues,
                allRows: Array.isArray(data) ? data.map(row => headers.map(h => String(row[h] || ''))) : [firstRowValues]
            };

            // Show the view toggle
            const viewToggle = document.getElementById('cmsViewToggle');
            if (viewToggle) {
                viewToggle.style.display = 'flex';
            }

            // Reset to CMS view
            this.currentView = 'cms';
            const viewBtns = document.querySelectorAll('.cms-view-btn');
            viewBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === 'cms');
            });

            // Use smart field mapping
            const title = this.findFieldByKeywords(item, ['title', 'name', 'event', 'talk', 'news'], ['timestamp', 'email', 'contact']);
            const summary = this.findFieldByKeywords(item, ['description', 'summary', 'about', 'brief', 'details']);
            const date = this.findFieldByKeywords(item, ['date and time', 'event date', 'date', 'when'], ['timestamp']);
            const location = this.findFieldByKeywords(item, ['location', 'place', 'venue', 'platform', 'where', 'address']);
            const url = this.findFieldByKeywords(item, ['url', 'link', 'website'], ['zoom']);
            const speaker = this.findFieldByKeywords(item, ['speaker', 'presenter', 'host', 'lecturer']);
            const category = this.findFieldByKeywords(item, ['type', 'category', 'kind']);

            const normalizedItem = {
                id: 'json-import-' + Date.now(),
                title: title || Object.values(item)[0] || 'Imported Item',
                summary: summary || '',
                date: date || new Date().toLocaleDateString('de-DE'),
                url: url || '',
                location: location || '',
                speaker: speaker || '',
                category: category?.toLowerCase()?.includes('event') ? 'event' :
                         category?.toLowerCase()?.includes('lecture') ? 'lecture' :
                         category?.toLowerCase()?.includes('news') ? 'news' : 'event'
            };

            this.generateFields(normalizedItem);
            App.showToast('JSON parsed successfully', 'success');

        } catch (error) {
            console.error('[CMSExportPage] JSON parse error:', error);
            App.showToast('Invalid JSON format', 'error');
        }
    },

    /**
     * Handle manual entry
     */
    handleManualEntry() {
        const contentType = document.getElementById('manualContentType').value;
        const title = document.getElementById('manualTitle').value.trim();
        const description = document.getElementById('manualDescription').value.trim();
        const date = document.getElementById('manualDate').value.trim();
        const url = document.getElementById('manualUrl')?.value.trim() || '';

        if (!title) {
            App.showToast('Title is required', 'error');
            return;
        }

        const item = {
            id: 'manual-' + Date.now(),
            title: title,
            summary: description,
            date: date || new Date().toLocaleDateString('de-DE'),
            url: url,
            category: contentType
        };

        this.generateFields(item);
        App.showToast('CMS fields generated', 'success');
    },

    /**
     * Show generated text section when a CSV item is selected
     */
    showGeneratedTextSection(item) {
        const existing = document.getElementById('cmsGeneratedTextSection');
        if (existing) existing.remove();

        if (!item.generatedText) return;

        const dePlain = item.generatedText.de?.plain || '';
        const enPlain = item.generatedText.en?.plain || '';

        const section = document.createElement('div');
        section.id = 'cmsGeneratedTextSection';
        section.style.cssText = 'margin-top: 16px;';
        section.innerHTML = `
            <div class="card" style="border: 1px solid rgba(0,146,96,0.2);">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 16px;">Generated Newsletter Text</h3>
                </div>
                <div style="padding: 16px;">
                    ${dePlain ? `
                    <div style="margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h4 style="margin: 0; font-size: 14px; color: var(--text-secondary);">German</h4>
                            <button class="cms-copy-btn" onclick="navigator.clipboard.writeText(this.closest('[data-text]').dataset.text).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy', 1500); })">Copy</button>
                        </div>
                        <div data-text="${dePlain.replace(/"/g, '&quot;')}" style="padding: 12px; background: var(--bg-secondary, #1a1f25); border-radius: 6px; white-space: pre-wrap; font-size: 13px; line-height: 1.5; max-height: 200px; overflow-y: auto;">${dePlain.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    </div>
                    ` : ''}
                    ${enPlain ? `
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <h4 style="margin: 0; font-size: 14px; color: var(--text-secondary);">English</h4>
                            <button class="cms-copy-btn" onclick="navigator.clipboard.writeText(this.closest('[data-text]').dataset.text).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy', 1500); })">Copy</button>
                        </div>
                        <div data-text="${enPlain.replace(/"/g, '&quot;')}" style="padding: 12px; background: var(--bg-secondary, #1a1f25); border-radius: 6px; white-space: pre-wrap; font-size: 13px; line-height: 1.5; max-height: 200px; overflow-y: auto;">${enPlain.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    </div>
                    ` : ''}
                    ${!dePlain && !enPlain ? '<p style="color: var(--text-secondary); font-size: 13px;">No generated text available. Save items from the CSV Processor to generate text.</p>' : ''}
                </div>
            </div>
        `;

        // Insert after the CMS fields panel
        const fieldsPanel = document.querySelector('.cms-fields-panel') || document.querySelector('#cmsFieldsOutput')?.closest('.card');
        if (fieldsPanel) {
            fieldsPanel.parentNode.insertBefore(section, fieldsPanel.nextSibling);
        }
    },

    /**
     * Escape HTML characters
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    CMSExportPage.init();
});

// Export for global access
window.CMSExportPage = CMSExportPage;
