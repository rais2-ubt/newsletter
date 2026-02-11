/**
 * Block Manager Module
 * Handles custom message blocks for newsletters
 */

const BlockManager = {
    // Block types
    TYPES: {
        NEWSLETTER_INTRO: 'newsletter-intro',
        SECTION_INTRO: 'section-intro',
        INLINE_BLOCK: 'inline-block',
        // New graphical block types
        IMAGE: 'image',
        CTA_BUTTON: 'cta-button',
        QUOTE: 'quote',
        FEATURE_BOX: 'feature-box',
        DIVIDER: 'divider',
        CALLOUT: 'callout'
    },

    // Callout styles
    CALLOUT_STYLES: {
        INFO: 'info',
        SUCCESS: 'success',
        WARNING: 'warning',
        HIGHLIGHT: 'highlight',
        RAIS: 'rais'
    },

    // Divider styles
    DIVIDER_STYLES: {
        SOLID: 'solid',
        GRADIENT: 'gradient',
        DOTS: 'dots',
        WAVE: 'wave'
    },

    // CTA Button variants
    CTA_VARIANTS: {
        PRIMARY: 'primary',
        SECONDARY: 'secondary',
        OUTLINE: 'outline'
    },

    // Storage key
    STORAGE_KEY: 'rais2_custom_blocks',

    // Current blocks
    blocks: [],

    // Callback for changes
    onChange: null,

    /**
     * Initialize block manager
     */
    init(options = {}) {
        this.onChange = options.onChange || null;
        this.loadBlocks();
    },

    /**
     * Create a new block
     */
    createBlock(type, options = {}) {
        // Get type-specific default data
        const typeData = this.getDefaultData(type, options);

        const block = {
            id: this.generateId(),
            type: type,
            title: options.title || this.getDefaultTitle(type),
            content: options.content || '',
            position: {
                section: options.section || null,
                afterItem: options.afterItem || null,
                index: options.index || 0
            },
            style: {
                variant: options.variant || 'default',
                showBorder: options.showBorder !== false
            },
            // Include type-specific data
            data: { ...typeData, ...options.data },
            aiGenerated: options.aiGenerated || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.blocks.push(block);
        this.saveBlocks();
        this.notifyChange();

        return block;
    },

    /**
     * Update a block
     */
    updateBlock(blockId, updates) {
        const index = this.blocks.findIndex(b => b.id === blockId);
        if (index === -1) return null;

        this.blocks[index] = {
            ...this.blocks[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveBlocks();
        this.notifyChange();

        return this.blocks[index];
    },

    /**
     * Delete a block
     */
    deleteBlock(blockId) {
        const index = this.blocks.findIndex(b => b.id === blockId);
        if (index === -1) return false;

        this.blocks.splice(index, 1);
        this.saveBlocks();
        this.notifyChange();

        return true;
    },

    /**
     * Get a block by ID
     */
    getBlock(blockId) {
        return this.blocks.find(b => b.id === blockId);
    },

    /**
     * Get all blocks
     */
    getBlocks() {
        return [...this.blocks];
    },

    /**
     * Get blocks by type
     */
    getBlocksByType(type) {
        return this.blocks.filter(b => b.type === type);
    },

    /**
     * Get newsletter intro block
     */
    getNewsletterIntro() {
        return this.blocks.find(b => b.type === this.TYPES.NEWSLETTER_INTRO);
    },

    /**
     * Get section intro block
     */
    getSectionIntro(sectionId) {
        return this.blocks.find(
            b => b.type === this.TYPES.SECTION_INTRO && b.position.section === sectionId
        );
    },

    /**
     * Get inline blocks for a section
     */
    getInlineBlocks(sectionId) {
        return this.blocks.filter(
            b => b.type === this.TYPES.INLINE_BLOCK && b.position.section === sectionId
        );
    },

    /**
     * Get or create newsletter intro
     */
    getOrCreateNewsletterIntro() {
        let intro = this.getNewsletterIntro();
        if (!intro) {
            intro = this.createBlock(this.TYPES.NEWSLETTER_INTRO, {
                title: 'Newsletter Introduction'
            });
        }
        return intro;
    },

    /**
     * Get or create section intro
     */
    getOrCreateSectionIntro(sectionId) {
        let intro = this.getSectionIntro(sectionId);
        if (!intro) {
            intro = this.createBlock(this.TYPES.SECTION_INTRO, {
                title: `${this.formatSectionName(sectionId)} Introduction`,
                section: sectionId
            });
        }
        return intro;
    },

    /**
     * Move block position
     */
    moveBlock(blockId, newPosition) {
        const block = this.getBlock(blockId);
        if (!block) return false;

        block.position = { ...block.position, ...newPosition };
        block.updatedAt = new Date().toISOString();

        this.saveBlocks();
        this.notifyChange();

        return true;
    },

    /**
     * Duplicate a block
     */
    duplicateBlock(blockId) {
        const original = this.getBlock(blockId);
        if (!original) return null;

        return this.createBlock(original.type, {
            title: `${original.title} (Copy)`,
            content: original.content,
            section: original.position.section,
            variant: original.style.variant,
            showBorder: original.style.showBorder
        });
    },

    /**
     * Get default title for block type
     */
    getDefaultTitle(type) {
        switch (type) {
            case this.TYPES.NEWSLETTER_INTRO:
                return 'Newsletter Introduction';
            case this.TYPES.SECTION_INTRO:
                return 'Section Introduction';
            case this.TYPES.INLINE_BLOCK:
                return 'Custom Block';
            case this.TYPES.IMAGE:
                return 'Image';
            case this.TYPES.CTA_BUTTON:
                return 'Call to Action';
            case this.TYPES.QUOTE:
                return 'Quote';
            case this.TYPES.FEATURE_BOX:
                return 'Feature Box';
            case this.TYPES.DIVIDER:
                return 'Divider';
            case this.TYPES.CALLOUT:
                return 'Callout';
            default:
                return 'Block';
        }
    },

    /**
     * Get default data for a block type
     */
    getDefaultData(type, options = {}) {
        switch (type) {
            case this.TYPES.IMAGE:
                return {
                    imageUrl: options.imageUrl || '',
                    altText: options.altText || '',
                    caption: options.caption || '',
                    linkUrl: options.linkUrl || '',
                    alignment: options.alignment || 'center',
                    maxWidth: options.maxWidth || 500
                };
            case this.TYPES.CTA_BUTTON:
                return {
                    buttonText: options.buttonText || 'Learn More',
                    linkUrl: options.linkUrl || '#',
                    variant: options.variant || 'primary',
                    alignment: options.alignment || 'center'
                };
            case this.TYPES.QUOTE:
                return {
                    quoteText: options.quoteText || '',
                    author: options.author || '',
                    authorRole: options.authorRole || '',
                    authorPhoto: options.authorPhoto || ''
                };
            case this.TYPES.FEATURE_BOX:
                return {
                    icon: options.icon || 'star',
                    heading: options.heading || '',
                    description: options.description || '',
                    linkUrl: options.linkUrl || '',
                    linkText: options.linkText || 'Learn more'
                };
            case this.TYPES.DIVIDER:
                return {
                    dividerStyle: options.dividerStyle || 'gradient'
                };
            case this.TYPES.CALLOUT:
                return {
                    calloutStyle: options.calloutStyle || 'info',
                    calloutTitle: options.calloutTitle || '',
                    calloutContent: options.calloutContent || ''
                };
            default:
                return {};
        }
    },

    /**
     * Format section name
     */
    formatSectionName(sectionId) {
        const names = {
            news: 'News',
            event: 'Events',
            lecture: 'Lectures'
        };
        return names[sectionId] || sectionId;
    },

    /**
     * Check if block has content
     */
    hasContent(blockId) {
        const block = this.getBlock(blockId);
        return block && block.content && block.content.trim().length > 0;
    },

    /**
     * Get blocks organized for newsletter generation
     */
    getBlocksForGeneration() {
        return {
            newsletterIntro: this.getNewsletterIntro(),
            sectionIntros: {
                news: this.getSectionIntro('news'),
                event: this.getSectionIntro('event'),
                lecture: this.getSectionIntro('lecture')
            },
            inlineBlocks: {
                news: this.getInlineBlocks('news'),
                event: this.getInlineBlocks('event'),
                lecture: this.getInlineBlocks('lecture')
            }
        };
    },

    /**
     * Save blocks to storage
     */
    saveBlocks() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                blocks: this.blocks,
                savedAt: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Failed to save blocks:', error);
        }
    },

    /**
     * Load blocks from storage
     */
    loadBlocks() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                this.blocks = data.blocks || [];
            }
        } catch (error) {
            console.error('Failed to load blocks:', error);
            this.blocks = [];
        }
    },

    /**
     * Clear all blocks
     */
    clearBlocks() {
        this.blocks = [];
        this.saveBlocks();
        this.notifyChange();
    },

    /**
     * Export blocks
     */
    exportBlocks() {
        return {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            blocks: this.blocks
        };
    },

    /**
     * Import blocks
     */
    importBlocks(data, merge = false) {
        if (!data.blocks || !Array.isArray(data.blocks)) {
            return { success: false, error: 'Invalid data format' };
        }

        if (merge) {
            // Merge with existing blocks
            data.blocks.forEach(block => {
                if (!this.blocks.find(b => b.id === block.id)) {
                    this.blocks.push(block);
                }
            });
        } else {
            // Replace all blocks
            this.blocks = data.blocks;
        }

        this.saveBlocks();
        this.notifyChange();

        return { success: true };
    },

    /**
     * Notify about changes
     */
    notifyChange() {
        if (this.onChange) {
            this.onChange(this.blocks);
        }

        window.dispatchEvent(new CustomEvent('blocksChange', {
            detail: { blocks: this.blocks }
        }));
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return 'block-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Render block for ordering panel
     */
    renderBlockItem(block) {
        const typeLabels = {
            [this.TYPES.NEWSLETTER_INTRO]: 'Intro',
            [this.TYPES.SECTION_INTRO]: 'Section',
            [this.TYPES.INLINE_BLOCK]: 'Block'
        };

        const hasContent = this.hasContent(block.id);
        const preview = block.content
            ? block.content.replace(/<[^>]*>/g, '').slice(0, 50) + '...'
            : 'No content';

        return `
            <div class="ordering-item custom-block-item" data-block-id="${block.id}" draggable="true">
                <div class="drag-handle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                </div>
                <div class="ordering-item-content">
                    <div class="ordering-item-title">
                        <span class="block-type-badge">${typeLabels[block.type]}</span>
                        ${block.title}
                    </div>
                    <div class="ordering-item-meta ${!hasContent ? 'empty' : ''}">
                        ${preview}
                    </div>
                </div>
                <div class="ordering-item-actions">
                    <button class="ordering-item-btn" onclick="BlockManager.editBlock('${block.id}')" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="ordering-item-btn" onclick="BlockManager.deleteBlockWithConfirm('${block.id}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Edit block (opens modal)
     */
    editBlock(blockId) {
        const block = this.getBlock(blockId);
        if (!block) return;

        // Dispatch event for UI to handle
        window.dispatchEvent(new CustomEvent('editBlock', {
            detail: { block }
        }));
    },

    /**
     * Delete block with confirmation
     */
    deleteBlockWithConfirm(blockId) {
        const block = this.getBlock(blockId);
        if (!block) return;

        if (confirm(`Delete "${block.title}"? This cannot be undone.`)) {
            this.deleteBlock(blockId);
            if (window.App) {
                App.showToast('Block deleted', 'success');
            }
        }
    }
};

// Export for use in other modules
window.BlockManager = BlockManager;
