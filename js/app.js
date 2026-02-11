/**
 * App Module
 * Main application controller for RAIS2 Newsletter Static Site
 */

const App = {
    // Current page
    currentPage: null,

    // Toast container
    toastContainer: null,

    // Feature detection results
    features: {
        indexedDB: false,
        serviceWorker: false,
        online: true
    },

    /**
     * Initialize application
     */
    init() {
        this.detectFeatures();
        this.detectCurrentPage();
        this.initToasts();
        this.initConnectionMonitoring();
        this.updateNavBadges();

        // Listen for storage changes
        window.addEventListener('storageChange', (e) => {
            this.updateNavBadges();
        });

        console.log('RAIS² Newsletter App initialized');
        console.log('Features:', this.features);
    },

    /**
     * Detect available browser features
     */
    detectFeatures() {
        // IndexedDB support
        this.features.indexedDB = 'indexedDB' in window;

        // Service Worker support
        this.features.serviceWorker = 'serviceWorker' in navigator;

        // Online status
        this.features.online = navigator.onLine;

        // Log feature support
        if (!this.features.indexedDB) {
            console.warn('IndexedDB not supported - using localStorage fallback');
        }
        if (!this.features.serviceWorker) {
            console.warn('Service Workers not supported - offline mode unavailable');
        }
    },

    /**
     * Initialize connection monitoring
     */
    initConnectionMonitoring() {
        // Update on online/offline events
        window.addEventListener('online', () => {
            this.features.online = true;
            this.onConnectionChange(true);
        });

        window.addEventListener('offline', () => {
            this.features.online = false;
            this.onConnectionChange(false);
        });
    },

    /**
     * Handle connection status change
     * @param {boolean} isOnline - Whether now online
     */
    onConnectionChange(isOnline) {
        console.log(`Connection status: ${isOnline ? 'online' : 'offline'}`);

        if (isOnline) {
            this.showToast('Connection restored', 'success');

            // Update dashboard if available
            if (window.ScrapeDashboard) {
                ScrapeDashboard.updateProgress(0, 'Online - ready to scrape');
            }
        } else {
            this.showToast('You are offline. Showing cached content.', 'info', 5000);

            // Update dashboard if available
            if (window.ScrapeDashboard) {
                ScrapeDashboard.updateProgress(0, 'Offline - using cached content');
            }
        }

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('connectionChange', {
            detail: { online: isOnline }
        }));
    },

    /**
     * Check if online
     * @returns {boolean} Online status
     */
    isOnline() {
        return this.features.online && navigator.onLine;
    },

    /**
     * Detect current page from URL
     */
    detectCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop().replace('.html', '') || 'index';
        this.currentPage = page;
    },

    /**
     * Initialize toast notifications
     */
    initToasts() {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
    },

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, info)
     * @param {number} duration - Display duration in ms
     */
    showToast(message, type = 'info', duration = 3000) {
        // Use Motion module if available for enhanced animations
        if (window.Motion) {
            return Motion.showToast(message, type, duration);
        }

        // Fallback to basic toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Update navigation badges
     */
    updateNavBadges() {
        // Update subscriber count badge
        const subBadge = document.querySelector('[data-badge="subscribers"]');
        if (subBadge) {
            const counts = SubscriberManager.getCounts();
            subBadge.textContent = counts.active;
            subBadge.style.display = counts.active > 0 ? 'inline' : 'none';
        }

        // Update newsletter count badge
        const nlBadge = document.querySelector('[data-badge="newsletters"]');
        if (nlBadge) {
            const newsletters = StorageManager.getNewsletters();
            const count = newsletters.newsletters.length;
            nlBadge.textContent = count;
            nlBadge.style.display = count > 0 ? 'inline' : 'none';
        }
    },

    /**
     * Show loading state
     * @param {HTMLElement} container - Container element
     * @param {string} type - Loading type: 'spinner', 'dots', 'skeleton'
     * @param {number} skeletonCount - Number of skeleton cards (for skeleton type)
     */
    showLoading(container, type = 'dots', skeletonCount = 3) {
        // Use Motion module if available for enhanced loaders
        if (window.Motion) {
            if (type === 'skeleton') {
                Motion.showSkeleton(container, skeletonCount);
            } else {
                Motion.showDotLoader(container);
            }
            return;
        }

        // Fallback to basic spinner
        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;
    },

    /**
     * Show empty state
     * @param {HTMLElement} container - Container element
     * @param {string} message - Empty message
     * @param {string} icon - Optional icon SVG
     */
    showEmpty(container, message, icon = null) {
        container.innerHTML = `
            <div class="empty-state">
                ${icon || ''}
                <h3>Nothing here yet</h3>
                <p>${message}</p>
            </div>
        `;
    },

    /**
     * Show alert
     * @param {HTMLElement} container - Container element
     * @param {string} message - Alert message
     * @param {string} type - Alert type
     */
    showAlert(container, message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        container.prepend(alert);

        setTimeout(() => alert.remove(), 5000);
    },

    /**
     * Format date for display
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Format relative time
     * @param {string|Date} date - Date to format
     * @returns {string} Relative time string
     */
    formatRelativeTime(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return this.formatDate(date);
    },

    /**
     * Confirm action dialog
     * @param {string} message - Confirmation message
     * @returns {boolean} User response
     */
    confirm(message) {
        return window.confirm(message);
    },

    /**
     * Open modal
     * @param {string} modalId - Modal element ID
     */
    openModal(modalId) {
        // Use Motion module if available for enhanced animations
        if (window.Motion) {
            Motion.openModal(modalId);
            return;
        }

        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Close modal
     * @param {string} modalId - Modal element ID
     */
    async closeModal(modalId) {
        // Use Motion module if available for enhanced animations
        if (window.Motion) {
            await Motion.closeModal(modalId);
            return;
        }

        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Close all modals
     */
    async closeAllModals() {
        // Use Motion module if available for enhanced animations
        if (window.Motion) {
            await Motion.closeAllModals();
            return;
        }

        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Escape HTML
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard', 'success');
            return true;
        } catch (e) {
            this.showToast('Failed to copy', 'error');
            return false;
        }
    },

    /**
     * Download file
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} type - MIME type
     */
    downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Read file as text
     * @param {File} file - File to read
     * @returns {Promise<string>} File content
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
};

// SVG Icons used across the app
const Icons = {
    dashboard: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>`,
    scrape: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`,
    create: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z"/></svg>`,
    archive: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
    subscribers: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    email: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
    delete: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
    edit: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    info: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`,
    menu: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
    view: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`,
    add: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
    upload: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for use in other modules
window.App = App;
window.Icons = Icons;
