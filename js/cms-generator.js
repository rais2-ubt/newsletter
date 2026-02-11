/**
 * CMS Generator Module
 * Generates content formatted for University of Bayreuth CMS "Akkordeonelement" template
 */

const CMSGenerator = {
    // CMS Field Schema for Akkordeonelement template
    FIELD_SCHEMA: {
        allgemein: {
            name: { label: 'Name', required: true, placeholder: 'akkordeon_01_event' },
            titel: { label: 'Titel', required: true, placeholder: 'Event Title' },
            pfad: { label: 'Pfad', required: false, placeholder: '/de/Uni_Bayreuth/.../events/' },
            dateiendung: { label: 'Dateiendung', required: false, default: 'html' },
            vorlage: { label: 'Vorlage', required: true, default: 'Akkordeonelement' }
        },
        content: {
            titel: { label: 'Titel', required: true, placeholder: 'Content Title' },
            hauptinhalt: { label: 'Hauptinhalt', required: true, placeholder: 'Main HTML content...', multiline: true }
        },
        flipside: {
            sortierfeld: { label: 'Sortierfeld', required: false, placeholder: '0010' },
            bildausrichtung: { label: 'Bildausrichtung Text-Bild-Modul', required: false, default: 'links klein' },
            linkZuBild: { label: 'Link zu Bild', required: false, placeholder: 'https://...' },
            bildunterschrift: { label: 'Bildunterschrift', required: false, placeholder: '' },
            copyrightAmBildZeigen: { label: 'Copyright am Bild zeigen', required: false, default: false },
            bildFuerVergroesserteVersion: { label: 'Bild für vergrößerte Version', required: false, placeholder: '' }
        },
        felder: {
            gueltigAb: { label: 'Gültig ab', required: false, type: 'datetime', placeholder: 'DD.MM.YYYY HH:MM' },
            gueltigBis: { label: 'Gültig bis', required: false, type: 'datetime', placeholder: 'DD.MM.YYYY HH:MM' },
            dateiendung: { label: 'Dateiendung', required: false, default: 'html' },
            channels: { label: 'Channels', required: false, type: 'array', placeholder: '' }
        }
    },

    // Content type configurations for mapping item data to CMS fields
    CONTENT_TYPES: {
        event: {
            prefix: 'event',
            pathBase: '/de/Uni_Bayreuth/Forschungseinrichtungen_2016/RAIS2/en/events/',
            generateHtml: (item) => CMSGenerator.generateEventHtml(item)
        },
        lecture: {
            prefix: 'lecture',
            pathBase: '/de/Uni_Bayreuth/Forschungseinrichtungen_2016/RAIS2/en/events/lecture_series/',
            generateHtml: (item) => CMSGenerator.generateLectureHtml(item)
        },
        news: {
            prefix: 'news',
            pathBase: '/de/Uni_Bayreuth/Forschungseinrichtungen_2016/RAIS2/en/news/',
            generateHtml: (item) => CMSGenerator.generateNewsHtml(item)
        }
    },

    // Current state
    currentItem: null,
    currentFields: null,

    /**
     * Initialize the CMS Generator
     */
    init() {
        console.log('[CMSGenerator] Initialized');
    },

    /**
     * Generate CMS fields from a newsletter item
     * @param {Object} item - Newsletter item (news, event, or lecture)
     * @param {string} template - Template name (default: 'akkordeonelement')
     * @returns {Object} Generated CMS fields
     */
    generateFromItem(item, template = 'akkordeonelement') {
        if (!item) {
            throw new Error('Item is required');
        }

        const contentType = this.CONTENT_TYPES[item.category] || this.CONTENT_TYPES.news;
        const slug = this.slugify(item.title);
        const sortDate = this.parseDateToSortable(item.date);

        const fields = {
            allgemein: {
                name: `akkordeon_${contentType.prefix}_${slug}`.substring(0, 50),
                titel: item.title,
                pfad: `${contentType.pathBase}${slug}/`,
                dateiendung: 'html',
                vorlage: 'Akkordeonelement'
            },
            content: {
                titel: item.title,
                hauptinhalt: contentType.generateHtml(item)
            },
            flipside: {
                sortierfeld: sortDate,
                bildausrichtung: 'links klein',
                linkZuBild: item.image || '',
                bildunterschrift: '',
                copyrightAmBildZeigen: false,
                bildFuerVergroesserteVersion: ''
            },
            felder: {
                gueltigAb: this.formatDateForCMS(item.date),
                gueltigBis: '',
                dateiendung: 'html',
                channels: []
            }
        };

        this.currentItem = item;
        this.currentFields = fields;

        return fields;
    },

    /**
     * Generate CMS fields from form data with custom mapping
     * @param {Object} formData - Data from Google Forms/CSV/JSON
     * @param {Object} mapping - Field mapping configuration
     * @param {string} contentType - Type of content (event, lecture, news)
     * @returns {Object} Generated CMS fields
     */
    generateFromFormData(formData, mapping, contentType = 'event') {
        const typeConfig = this.CONTENT_TYPES[contentType] || this.CONTENT_TYPES.news;

        // Build item from mapped fields
        const item = {
            title: formData[mapping.title] || '',
            summary: formData[mapping.summary] || formData[mapping.description] || '',
            date: formData[mapping.date] || '',
            url: formData[mapping.url] || '',
            category: contentType,
            speaker: formData[mapping.speaker] || '',
            location: formData[mapping.location] || '',
            time: formData[mapping.time] || '',
            image: formData[mapping.image] || ''
        };

        return this.generateFromItem(item);
    },

    /**
     * Generate HTML content for an event
     */
    generateEventHtml(item) {
        const parts = [];

        if (item.date) {
            parts.push(`<p><strong>Date:</strong> ${item.date}</p>`);
        }
        if (item.time) {
            parts.push(`<p><strong>Time:</strong> ${item.time}</p>`);
        }
        if (item.location) {
            parts.push(`<p><strong>Location:</strong> ${item.location}</p>`);
        }

        if (item.summary) {
            parts.push(`<p>${this.escapeHtml(item.summary)}</p>`);
        }

        if (item.url) {
            parts.push(`<p><a href="${this.escapeHtml(item.url)}">More information</a></p>`);
        }

        return parts.join('\n');
    },

    /**
     * Generate HTML content for a lecture
     */
    generateLectureHtml(item) {
        const parts = [];

        if (item.speaker) {
            parts.push(`<p><strong>Speaker:</strong> ${this.escapeHtml(item.speaker)}</p>`);
        }
        if (item.date) {
            parts.push(`<p><strong>Date:</strong> ${item.date}</p>`);
        }
        if (item.time) {
            parts.push(`<p><strong>Time:</strong> ${item.time}</p>`);
        }
        if (item.location) {
            parts.push(`<p><strong>Location:</strong> ${item.location}</p>`);
        }

        if (item.summary) {
            parts.push(`<p>${this.escapeHtml(item.summary)}</p>`);
        }

        if (item.url) {
            parts.push(`<p><a href="${this.escapeHtml(item.url)}">More information</a></p>`);
        }

        return parts.join('\n');
    },

    /**
     * Generate HTML content for news
     */
    generateNewsHtml(item) {
        const parts = [];

        if (item.date) {
            parts.push(`<p><em>${item.date}</em></p>`);
        }

        if (item.summary) {
            parts.push(`<p>${this.escapeHtml(item.summary)}</p>`);
        }

        if (item.url) {
            parts.push(`<p><a href="${this.escapeHtml(item.url)}">Read more</a></p>`);
        }

        return parts.join('\n');
    },

    /**
     * Copy a single field value to clipboard
     * @param {string} value - The value to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyField(value) {
        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch (error) {
            // Fallback for older browsers
            return this.fallbackCopy(value);
        }
    },

    /**
     * Fallback copy method using textarea
     */
    fallbackCopy(value) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        } catch (error) {
            console.error('[CMSGenerator] Fallback copy failed:', error);
            return false;
        }
    },

    /**
     * Copy all fields as formatted text
     * @param {Object} fields - All CMS fields
     * @returns {Promise<boolean>} Success status
     */
    async copyAllFields(fields) {
        const text = this.formatFieldsAsText(fields);
        return this.copyField(text);
    },

    /**
     * Format all fields as readable text
     */
    formatFieldsAsText(fields) {
        const lines = [];

        for (const [groupName, groupFields] of Object.entries(fields)) {
            lines.push(`=== ${groupName.toUpperCase()} ===`);
            for (const [fieldName, value] of Object.entries(groupFields)) {
                const displayValue = typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') :
                                    Array.isArray(value) ? value.join(', ') : value;
                lines.push(`${fieldName}: ${displayValue}`);
            }
            lines.push('');
        }

        return lines.join('\n');
    },

    /**
     * Get field schema for a specific field
     */
    getFieldSchema(groupName, fieldName) {
        return this.FIELD_SCHEMA[groupName]?.[fieldName] || null;
    },

    /**
     * Get all field groups
     */
    getFieldGroups() {
        return Object.keys(this.FIELD_SCHEMA);
    },

    /**
     * Get all fields in a group
     */
    getFieldsInGroup(groupName) {
        return this.FIELD_SCHEMA[groupName] || {};
    },

    // ==================== Utility Functions ====================

    /**
     * Convert string to URL-safe slug
     */
    slugify(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .replace(/[äÄ]/g, 'ae')
            .replace(/[öÖ]/g, 'oe')
            .replace(/[üÜ]/g, 'ue')
            .replace(/[ß]/g, 'ss')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .substring(0, 50);
    },

    /**
     * Parse date string to sortable format (YYYYMMDD)
     */
    parseDateToSortable(dateStr) {
        if (!dateStr) return '0000';

        // Try to parse various date formats
        const patterns = [
            /(\d{1,2})\.(\d{1,2})\.(\d{4})/,  // DD.MM.YYYY
            /(\d{4})-(\d{2})-(\d{2})/,         // YYYY-MM-DD
            /(\d{1,2})\/(\d{1,2})\/(\d{4})/    // MM/DD/YYYY
        ];

        for (const pattern of patterns) {
            const match = dateStr.match(pattern);
            if (match) {
                if (pattern === patterns[0]) {
                    // DD.MM.YYYY
                    return `${match[3]}${match[2].padStart(2, '0')}${match[1].padStart(2, '0')}`;
                } else if (pattern === patterns[1]) {
                    // YYYY-MM-DD
                    return `${match[1]}${match[2]}${match[3]}`;
                } else {
                    // MM/DD/YYYY
                    return `${match[3]}${match[1].padStart(2, '0')}${match[2].padStart(2, '0')}`;
                }
            }
        }

        return '0000';
    },

    /**
     * Format date for CMS (DD.MM.YYYY HH:MM format)
     */
    formatDateForCMS(dateStr) {
        if (!dateStr) return '';

        // If already in correct format, return as-is
        if (/^\d{1,2}\.\d{1,2}\.\d{4}/.test(dateStr)) {
            // Add time if not present
            if (!/\d{2}:\d{2}/.test(dateStr)) {
                return `${dateStr} 00:00`;
            }
            return dateStr;
        }

        // Try to parse and reformat
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year} 00:00`;
        }

        return dateStr;
    },

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Render preview HTML for the CMS content
     */
    renderPreview(fields) {
        if (!fields || !fields.content) return '';

        return `
            <div class="cms-preview-content">
                <h4>${this.escapeHtml(fields.content.titel)}</h4>
                <div class="cms-preview-body">
                    ${fields.content.hauptinhalt}
                </div>
            </div>
        `;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CMSGenerator;
}

// Export for browser use
window.CMSGenerator = CMSGenerator;
