/**
 * CSV Utilities Module
 * Shared CSV parsing, transformation, and content generation logic
 * Used by csv-processor.html, builder.html, and cms-export-page.js
 */

const CSVUtils = {
    // Field mapping arrays for flexible column name matching
    FIELD_MAPS: {
        type: ['Type of Submission', 'Type'],
        title: [
            'Title of Event/Talk/News',
            'What is the title of the talk/lecture?',
            'What is the title?',
            'What is the title of the event?',
            'Title'
        ],
        description: [
            'Brief Description (What is it about?)',
            'Description of the event',
            'Description of the news/announcements',
            'Abstract of the topic of the talk/lecture',
            'Abstract of the topic of the talk/lecture?',
            'Description'
        ],
        speaker: ['Who will be the speaker?', 'Speaker', 'Who will be the speaker'],
        date: [
            'When will the talk/lecture take place?',
            'When will the talk/lecture take place',
            'Date',
            'When',
            'Timestamp'
        ],
        location: [
            'Where will the talk/lecture take place?',
            'Where will the talk/lecture take place',
            'Location',
            'Where'
        ],
        duration: [
            'Duration (If applicable, e.g., 1h 30m 0s)',
            'Duration',
            'Duration (If applicable, e.g., 1h 30m 0s)'
        ],
        hybrid: [
            'Will there be a hybrid option?',
            'Will there be a hybrid option',
            'Hybrid',
            'If there is a hyprid'
        ],
        biography: [
            'Biography of the speaker (optional)',
            'Biography',
            'Biography of the speaker'
        ],
        contactEmail: [
            'Primary Contact Email (for follow-up questions)',
            'Email',
            'Contact Email',
            'Contact'
        ]
    },

    // Field definitions per type (required/optional for inspector)
    TYPE_FIELDS: {
        lecture:    { required: ['title', 'speaker', 'date', 'location'], optional: ['duration', 'hybrid', 'description', 'biography'] },
        event:     { required: ['title', 'description', 'date', 'location'], optional: ['duration', 'hybrid'] },
        workshop:  { required: ['title', 'speaker', 'date', 'location', 'description'], optional: ['duration', 'hybrid'] },
        conference:{ required: ['title', 'description', 'date', 'location'], optional: ['duration'] },
        cfp:       { required: ['title', 'description', 'date'], optional: ['contactEmail'] },
        news:      { required: ['title', 'description'], optional: [] }
    },

    // Human-readable type labels
    TYPE_LABELS: {
        lecture: { de: 'Vorlesung/Vortrag', en: 'Lecture/Talk' },
        event: { de: 'Veranstaltung', en: 'Event' },
        workshop: { de: 'Workshop', en: 'Workshop' },
        conference: { de: 'Konferenz', en: 'Conference' },
        cfp: { de: 'Ausschreibung', en: 'Call for Papers' },
        news: { de: 'Allgemeine Nachrichten', en: 'General News' }
    },

    // Field labels for the inspector
    FIELD_LABELS: {
        title: { de: 'Titel', en: 'Title' },
        description: { de: 'Beschreibung', en: 'Description' },
        speaker: { de: 'Referent/in', en: 'Speaker' },
        date: { de: 'Datum & Uhrzeit', en: 'Date & Time' },
        duration: { de: 'Dauer', en: 'Duration' },
        location: { de: 'Ort', en: 'Location' },
        hybrid: { de: 'Hybrid-Option', en: 'Hybrid Option' },
        biography: { de: 'Biografie', en: 'Biography' },
        contactEmail: { de: 'Kontakt-E-Mail', en: 'Contact Email' }
    },

    /**
     * Parse CSV text into an array of objects
     */
    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = this.parseCSVLine(lines[0]);
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === 0) continue;

            const item = {};
            headers.forEach((header, index) => {
                const value = values[index] || '';
                if (item[header]) {
                    if (value && !item[header].includes(value)) {
                        item[header] = item[header] + ' ' + value;
                    }
                } else {
                    item[header] = value;
                }
            });
            data.push(item);
        }

        return data;
    },

    /**
     * Parse a single CSV line handling quoted fields
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    },

    /**
     * Extract a field value trying multiple possible column names
     */
    extractField(item, possibleKeys) {
        for (const key of possibleKeys) {
            const value = item[key];
            if (value && value.trim()) {
                return value.trim();
            }
        }
        return '';
    },

    /**
     * Detect category from a type string
     */
    detectType(typeStr) {
        if (!typeStr) return 'news';
        const t = typeStr.toLowerCase();
        if (t.includes('lecture') || t.includes('talk') || t.includes('vortrag') || t.includes('vorlesung')) return 'lecture';
        if (t.includes('workshop')) return 'workshop';
        if (t.includes('conference') || t.includes('konferenz')) return 'conference';
        if (t.includes('call for') || t.includes('submission') || t.includes('position') || t.includes('ausschreibung')) return 'cfp';
        if (t.includes('event') || t.includes('veranstaltung')) return 'event';
        return 'news';
    },

    /**
     * Transform a raw CSV row into a builder-compatible item
     */
    transformItem(rawItem, language = 'de') {
        const type = this.extractField(rawItem, this.FIELD_MAPS.type) || 'General News or Announcement';
        const title = this.extractField(rawItem, this.FIELD_MAPS.title) || 'Untitled';
        const category = this.detectType(type);

        return {
            title: title,
            date: this.extractField(rawItem, this.FIELD_MAPS.date) || new Date().toLocaleDateString('de-DE'),
            summary: this.extractField(rawItem, this.FIELD_MAPS.description) || '',
            url: '#',
            category: category,
            csvType: type,
            speaker: this.extractField(rawItem, this.FIELD_MAPS.speaker) || '',
            location: this.extractField(rawItem, this.FIELD_MAPS.location) || '',
            duration: this.extractField(rawItem, this.FIELD_MAPS.duration) || '',
            hybrid: this.extractField(rawItem, this.FIELD_MAPS.hybrid) || '',
            biography: this.extractField(rawItem, this.FIELD_MAPS.biography) || '',
            language: language,
            rawCsvData: rawItem
        };
    },

    /**
     * Transform an array of raw CSV rows into builder-compatible items
     */
    transformItems(rawItems, language = 'de') {
        return rawItems.map(item => this.transformItem(item, language));
    },

    // ===== Content Generation =====

    /**
     * Extract all common fields from a raw CSV item
     */
    _extractFields(item) {
        const type = this.extractField(item, this.FIELD_MAPS.type) || '';
        return {
            type: type,
            category: this.detectType(type),
            title: this.extractField(item, this.FIELD_MAPS.title) || '',
            description: this.extractField(item, this.FIELD_MAPS.description) || '',
            speaker: this.extractField(item, this.FIELD_MAPS.speaker) || '',
            location: this.extractField(item, this.FIELD_MAPS.location) || '',
            date: this.extractField(item, this.FIELD_MAPS.date) || '',
            duration: this.extractField(item, this.FIELD_MAPS.duration) || '',
            hybrid: this.extractField(item, this.FIELD_MAPS.hybrid) || '',
            biography: this.extractField(item, this.FIELD_MAPS.biography) || '',
            contactEmail: this.extractField(item, this.FIELD_MAPS.contactEmail) || ''
        };
    },

    /**
     * Format a date string into human-readable format
     */
    _formatDate(dateStr, lang) {
        if (!dateStr) return '';
        try {
            let d;
            if (dateStr.includes('/')) {
                const parts = dateStr.split(' ');
                const datePart = parts[0];
                const [month, day, year] = datePart.split('/');
                d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
                d = new Date(dateStr);
            }
            if (isNaN(d.getTime())) return dateStr;
            const months = lang === 'de'
                ? ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
                : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
        } catch (e) {
            return dateStr;
        }
    },

    /**
     * Extract time from a date string
     */
    _formatTime(dateStr, lang) {
        if (!dateStr) return '';
        try {
            let d;
            if (dateStr.includes('/') && dateStr.includes(' ')) {
                const parts = dateStr.split(' ');
                if (parts.length >= 2) {
                    const timePart = parts[1];
                    const [hours, minutes] = timePart.split(':');
                    const datePart = parts[0];
                    const [month, day, year] = datePart.split('/');
                    d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
                } else {
                    d = new Date(dateStr);
                }
            } else {
                d = new Date(dateStr);
            }
            if (isNaN(d.getTime())) return '';
            return d.toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    },

    /**
     * Generate an LLM prompt for a raw CSV item
     */
    generatePrompt(item, lang) {
        const f = this._extractFields(item);
        const typeLabel = this.TYPE_LABELS[f.category] || this.TYPE_LABELS.news;

        if (lang === 'de') {
            return `Erstelle eine Newsletter-Ankündigung für eine ${typeLabel.de} mit folgenden Informationen:

Titel: ${f.title}
${f.description ? `Beschreibung: ${f.description}` : ''}
${f.speaker ? `Referent/in: ${f.speaker}` : ''}
${f.biography ? `Biografie: ${f.biography}` : ''}
${f.date ? `Datum und Uhrzeit: ${f.date}` : ''}
${f.duration ? `Dauer: ${f.duration}` : ''}
${f.location ? `Ort: ${f.location}` : ''}
${f.hybrid ? `Hybrid-Option: ${f.hybrid}` : ''}

Format: Erstelle eine professionelle Ankündigung im Stil der RAIS² Newsletter, ähnlich wie:
"Vorlesung 'Einführung in Algorithmische Fairness'
Dr. Timo Speith vom Lehrstuhl für Philosophie, Informatik und KI an der Universität Bayreuth wird am 27. November 2025 von 18:00 bis 19:00 Uhr im Raum S 66 (RW1) eine Vorlesung mit dem Titel 'Einführung in Algorithmische Fairness' für den Verein b{u}ilt halten."`;
        } else {
            return `Create a newsletter announcement for a ${f.type === 'Lecture' ? 'lecture' : f.type === 'Event' ? 'event' : 'news item'} with the following information:

Title: ${f.title}
${f.description ? `Description: ${f.description}` : ''}
${f.speaker ? `Speaker: ${f.speaker}` : ''}
${f.biography ? `Biography: ${f.biography}` : ''}
${f.date ? `Date and Time: ${f.date}` : ''}
${f.duration ? `Duration: ${f.duration}` : ''}
${f.location ? `Location: ${f.location}` : ''}
${f.hybrid ? `Hybrid Option: ${f.hybrid}` : ''}

Format: Create a professional announcement in the style of RAIS² newsletter, similar to:
"Lecture 'Introduction to Algorithmic Fairness'
Dr. Timo Speith from the Chair of Philosophy, Computer Science, and AI at the University of Bayreuth will give a lecture titled 'Introduction to Algorithmic Fairness' for the association b{u}ilt on November 27, 2025, from 18:00 to 19:00 in room S 66 (RW1)."`;
        }
    },

    /**
     * Generate styled HTML for a raw CSV item
     */
    generateHTML(item, lang) {
        const f = this._extractFields(item);
        const fmtD = (d) => this._formatDate(d, lang);
        const fmtT = (d) => this._formatTime(d, lang);
        const cat = f.category;
        const de = lang === 'de';
        const h2 = (text) => `<h2 style="color: #009260; font-family: 'Crimson Text', serif; font-size: 24px; margin-bottom: 16px;">${text}</h2>`;
        const p = (text) => `<p style="margin-bottom: 8px;">${text}</p>`;
        const desc = (text) => `<p style="margin-bottom: 12px;">${text}</p>`;
        const box = (text) => `<div style="margin-top: 16px; padding: 16px; background: #e6f4ef; border-left: 4px solid #009260; border-radius: 4px;"><p style="margin: 0;">${text}</p></div>`;
        const hasHybrid = f.hybrid && f.hybrid.toLowerCase() !== 'no' && f.hybrid.toLowerCase() !== 'nein';
        const dateStr = f.date ? `${fmtD(f.date)}${fmtT(f.date) ? (de ? `, ${fmtT(f.date)} Uhr` : `, ${fmtT(f.date)}`) : ''}` : '';

        let html = `<div style="font-family: 'Source Sans Pro', sans-serif; color: #48535A; line-height: 1.6;">`;

        if (cat === 'lecture') {
            html += h2(de ? `Vorlesung "${f.title}"` : `Lecture "${f.title}"`);
            if (f.speaker) { html += `<p style="margin-bottom: 12px;"><strong>${f.speaker}</strong>${f.biography ? ` - ${f.biography}` : ''}</p>`; }
            if (f.date) html += p(`\uD83D\uDCC5 <strong>${de ? 'Datum' : 'Date'}:</strong> ${dateStr}`);
            if (f.duration) html += p(`\u23F1\uFE0F <strong>${de ? 'Dauer' : 'Duration'}:</strong> ${f.duration}`);
            if (f.location) html += p(`\uD83D\uDCCD <strong>${de ? 'Ort' : 'Location'}:</strong> ${f.location}`);
            if (hasHybrid) html += p(`\uD83D\uDCBB <strong>${de ? 'Hybrid-Option verfügbar' : 'Hybrid option available'}</strong>`);
            if (f.description) html += box(f.description);
        } else if (cat === 'workshop') {
            html += h2(de ? `Workshop: ${f.title}` : `Workshop: ${f.title}`);
            if (f.speaker) { html += `<p style="margin-bottom: 12px;"><strong>${de ? 'Leitung' : 'Facilitated by'}:</strong> ${f.speaker}</p>`; }
            if (f.description) html += desc(f.description);
            if (f.date) html += p(`\uD83D\uDCC5 <strong>${de ? 'Datum' : 'Date'}:</strong> ${dateStr}`);
            if (f.duration) html += p(`\u23F1\uFE0F <strong>${de ? 'Dauer' : 'Duration'}:</strong> ${f.duration}`);
            if (f.location) html += p(`\uD83D\uDCCD <strong>${de ? 'Ort' : 'Location'}:</strong> ${f.location}`);
            if (hasHybrid) html += p(`\uD83D\uDCBB <strong>${de ? 'Hybrid-Option verfügbar' : 'Hybrid option available'}</strong>`);
        } else if (cat === 'conference') {
            html += h2(de ? `Konferenz: ${f.title}` : `Conference: ${f.title}`);
            if (f.description) html += desc(f.description);
            if (f.date) html += p(`\uD83D\uDCC5 <strong>${de ? 'Datum' : 'Date'}:</strong> ${dateStr}`);
            if (f.duration) html += p(`\u23F1\uFE0F <strong>${de ? 'Dauer' : 'Duration'}:</strong> ${f.duration}`);
            if (f.location) html += p(`\uD83D\uDCCD <strong>${de ? 'Ort' : 'Location'}:</strong> ${f.location}`);
        } else if (cat === 'cfp') {
            html += h2(de ? `Ausschreibung: ${f.title}` : `Call for Papers: ${f.title}`);
            if (f.description) html += desc(f.description);
            if (f.date) html += p(`\u23F0 <strong>${de ? 'Frist' : 'Deadline'}:</strong> ${dateStr}`);
            if (f.contactEmail) html += p(`\u2709\uFE0F <strong>${de ? 'Kontakt' : 'Contact'}:</strong> ${f.contactEmail}`);
        } else if (cat === 'event') {
            html += h2(f.title);
            if (f.description) html += desc(f.description);
            if (f.date) html += p(`\uD83D\uDCC5 <strong>${de ? 'Datum' : 'Date'}:</strong> ${dateStr}`);
            if (f.location) html += p(`\uD83D\uDCCD <strong>${de ? 'Ort' : 'Location'}:</strong> ${f.location}`);
            if (f.duration) html += p(`\u23F1\uFE0F <strong>${de ? 'Dauer' : 'Duration'}:</strong> ${f.duration}`);
            if (hasHybrid) html += p(`\uD83D\uDCBB <strong>${de ? 'Hybrid-Option verfügbar' : 'Hybrid option available'}</strong>`);
        } else {
            html += h2(f.title || (de ? 'Ankündigung' : 'Announcement'));
            if (f.description) html += desc(f.description);
        }

        html += `</div>`;
        return html;
    },

    /**
     * Generate plain text newsletter content for a raw CSV item
     */
    generatePlainText(item, lang) {
        const f = this._extractFields(item);
        const fmtD = (d) => this._formatDate(d, lang);
        const fmtT = (d) => this._formatTime(d, lang);
        const cat = f.category;
        const de = lang === 'de';
        const hasHybrid = f.hybrid && f.hybrid.toLowerCase() !== 'no' && f.hybrid.toLowerCase() !== 'nein';
        const dateStr = f.date ? `${fmtD(f.date)}${fmtT(f.date) ? (de ? `, ${fmtT(f.date)} Uhr` : `, ${fmtT(f.date)}`) : ''}` : '';

        let text = '';

        if (cat === 'lecture') {
            text += de ? `Vorlesung "${f.title}"\n\n` : `Lecture "${f.title}"\n\n`;
            if (f.speaker) {
                text += `${f.speaker}`;
                if (f.biography) text += ` ${f.biography}`;
                text += de ? ` wird` : ` will give`;
            } else {
                text += de ? `Es wird` : `There will be`;
            }
            text += de ? ` eine Vorlesung mit dem Titel "${f.title}"` : ` a lecture titled "${f.title}"`;
            if (f.date) {
                const timeStr = fmtT(f.date);
                text += de
                    ? ` am ${fmtD(f.date)}${timeStr ? ` von ${timeStr} Uhr` : ''}`
                    : ` on ${fmtD(f.date)}${timeStr ? ` from ${timeStr}` : ''}`;
                if (f.duration) text += de ? ` (Dauer: ${f.duration})` : ` (Duration: ${f.duration})`;
            }
            if (f.location) {
                const hasRoom = f.location.toLowerCase().includes('raum') || f.location.toLowerCase().includes('room');
                text += de
                    ? (hasRoom ? ` im ${f.location}` : ` im Raum ${f.location}`)
                    : (hasRoom ? ` in ${f.location}` : ` in room ${f.location}`);
            }
            text += de ? ` geben.` : `.`;
            if (hasHybrid) text += de ? ` Es gibt eine Hybrid-Option.` : ` There is a hybrid option available.`;
            if (f.description) text += `\n\n${f.description}`;
        } else if (cat === 'workshop') {
            text += `Workshop: ${f.title}\n\n`;
            if (f.speaker) text += de ? `Leitung: ${f.speaker}\n` : `Facilitated by: ${f.speaker}\n`;
            if (f.description) text += `${f.description}\n\n`;
            if (f.date) text += `${de ? 'Datum' : 'Date'}: ${dateStr}\n`;
            if (f.duration) text += `${de ? 'Dauer' : 'Duration'}: ${f.duration}\n`;
            if (f.location) text += `${de ? 'Ort' : 'Location'}: ${f.location}\n`;
            if (hasHybrid) text += de ? `Hybrid-Option verfügbar\n` : `Hybrid option available\n`;
        } else if (cat === 'conference') {
            text += de ? `Konferenz: ${f.title}\n\n` : `Conference: ${f.title}\n\n`;
            if (f.description) text += `${f.description}\n\n`;
            if (f.date) text += `${de ? 'Datum' : 'Date'}: ${dateStr}\n`;
            if (f.duration) text += `${de ? 'Dauer' : 'Duration'}: ${f.duration}\n`;
            if (f.location) text += `${de ? 'Ort' : 'Location'}: ${f.location}\n`;
        } else if (cat === 'cfp') {
            text += de ? `Ausschreibung: ${f.title}\n\n` : `Call for Papers: ${f.title}\n\n`;
            if (f.description) text += `${f.description}\n\n`;
            if (f.date) text += `${de ? 'Frist' : 'Deadline'}: ${dateStr}\n`;
            if (f.contactEmail) text += `${de ? 'Kontakt' : 'Contact'}: ${f.contactEmail}\n`;
        } else if (cat === 'event') {
            text += `${f.title}\n\n`;
            if (f.description) text += `${f.description}\n\n`;
            if (f.date) text += `${de ? 'Datum' : 'Date'}: ${dateStr}\n`;
            if (f.location) text += `${de ? 'Ort' : 'Location'}: ${f.location}\n`;
            if (f.duration) text += `${de ? 'Dauer' : 'Duration'}: ${f.duration}\n`;
            if (hasHybrid) text += de ? `Hybrid-Option verfügbar\n` : `Hybrid option available\n`;
        } else {
            text += `${f.title || (de ? 'Ankündigung' : 'Announcement')}\n\n`;
            if (f.description) text += `${f.description}`;
        }

        return text.trim();
    },

    /**
     * Generate all text formats for a raw CSV item in a given language
     */
    generateAllTexts(rawItem, lang) {
        return {
            plain: this.generatePlainText(rawItem, lang),
            html: this.generateHTML(rawItem, lang),
            prompt: this.generatePrompt(rawItem, lang),
            generatedAt: new Date().toISOString()
        };
    },

    /**
     * Generate all texts for a stored/transformed item using its rawCsvData
     */
    generateTextsForItem(item) {
        const raw = item.rawCsvData;
        if (!raw) return null;
        return {
            de: this.generateAllTexts(raw, 'de'),
            en: this.generateAllTexts(raw, 'en')
        };
    }
};

window.CSVUtils = CSVUtils;
