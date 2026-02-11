/**
 * Drag and Drop Module
 * Handles reordering of items, sections, and custom blocks
 */

const DragDropManager = {
    // State
    draggedElement: null,
    dragType: null, // 'item', 'section', 'block'
    dropTarget: null,

    // Order state
    sectionOrder: ['news', 'event', 'lecture', 'publication', 'member', 'project'],
    itemOrder: {},

    // Callbacks
    onOrderChange: null,

    /**
     * Initialize drag and drop
     */
    init(options = {}) {
        this.onOrderChange = options.onOrderChange || null;
        this.loadOrder();
        this.setupEventListeners();
    },

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Prevent default drag behavior on the page
        document.addEventListener('dragover', (e) => {
            if (this.draggedElement) {
                e.preventDefault();
            }
        });

        document.addEventListener('drop', (e) => {
            if (this.draggedElement) {
                e.preventDefault();
            }
        });

        // Clean up on drag end
        document.addEventListener('dragend', () => {
            this.cleanupDrag();
        });
    },

    /**
     * Make an element draggable as an item
     */
    makeItemDraggable(element, itemId, sectionId) {
        element.setAttribute('draggable', 'true');
        element.dataset.itemId = itemId;
        element.dataset.sectionId = sectionId;

        element.addEventListener('dragstart', (e) => {
            this.handleItemDragStart(e, element, itemId, sectionId);
        });

        element.addEventListener('dragend', (e) => {
            this.handleDragEnd(e, element);
        });

        element.addEventListener('dragover', (e) => {
            this.handleItemDragOver(e, element);
        });

        element.addEventListener('dragleave', (e) => {
            this.handleDragLeave(e, element);
        });

        element.addEventListener('drop', (e) => {
            this.handleItemDrop(e, element, itemId, sectionId);
        });
    },

    /**
     * Make a section draggable
     */
    makeSectionDraggable(element, sectionId) {
        const header = element.querySelector('.ordering-section-header');
        if (!header) return;

        header.setAttribute('draggable', 'true');
        element.dataset.sectionId = sectionId;

        header.addEventListener('dragstart', (e) => {
            this.handleSectionDragStart(e, element, sectionId);
        });

        header.addEventListener('dragend', (e) => {
            this.handleDragEnd(e, element);
        });

        element.addEventListener('dragover', (e) => {
            this.handleSectionDragOver(e, element);
        });

        element.addEventListener('dragleave', (e) => {
            this.handleDragLeave(e, element);
        });

        element.addEventListener('drop', (e) => {
            this.handleSectionDrop(e, element, sectionId);
        });
    },

    /**
     * Setup a drop zone for items
     */
    setupItemDropZone(container, sectionId) {
        container.dataset.sectionId = sectionId;

        container.addEventListener('dragover', (e) => {
            if (this.dragType === 'item') {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                this.showDropIndicator(container, e.clientY);
            }
        });

        container.addEventListener('dragleave', (e) => {
            // Handle null relatedTarget (leaving document) or leaving container
            if (!e.relatedTarget || !container.contains(e.relatedTarget)) {
                this.hideDropIndicator(container);
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            this.hideDropIndicator(container);

            if (this.dragType === 'item' && this.draggedElement) {
                const itemId = this.draggedElement.dataset.itemId;
                const fromSection = this.draggedElement.dataset.sectionId;
                const toSection = sectionId;
                const targetIndex = this.getDropIndex(container, e.clientY);

                this.moveItem(itemId, fromSection, toSection, targetIndex);
            }
        });
    },

    /**
     * Handle item drag start
     */
    handleItemDragStart(e, element, itemId, sectionId) {
        this.draggedElement = element;
        this.dragType = 'item';

        element.classList.add('dragging');

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'item',
            itemId,
            sectionId
        }));

        // Create custom drag image
        this.createDragGhost(element);
    },

    /**
     * Handle section drag start
     */
    handleSectionDragStart(e, element, sectionId) {
        this.draggedElement = element;
        this.dragType = 'section';

        element.classList.add('dragging');

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'section',
            sectionId
        }));
    },

    /**
     * Handle drag end
     */
    handleDragEnd(e, element) {
        element.classList.remove('dragging');
        this.cleanupDrag();
    },

    /**
     * Handle item drag over
     */
    handleItemDragOver(e, element) {
        if (this.dragType !== 'item' || element === this.draggedElement) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = element.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;

        element.classList.remove('drop-above', 'drop-below');
        if (e.clientY < midY) {
            element.classList.add('drop-above');
        } else {
            element.classList.add('drop-below');
        }
    },

    /**
     * Handle section drag over
     */
    handleSectionDragOver(e, element) {
        if (this.dragType !== 'section' || element === this.draggedElement) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        element.classList.add('drag-over');
    },

    /**
     * Handle drag leave
     */
    handleDragLeave(e, element) {
        element.classList.remove('drag-over', 'drop-above', 'drop-below');
    },

    /**
     * Handle item drop
     */
    handleItemDrop(e, element, targetItemId, targetSectionId) {
        e.preventDefault();
        e.stopPropagation();

        element.classList.remove('drop-above', 'drop-below');

        if (this.dragType !== 'item' || !this.draggedElement) return;

        const itemId = this.draggedElement.dataset.itemId;
        const fromSection = this.draggedElement.dataset.sectionId;

        // Determine position (before or after target)
        const rect = element.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const insertAfter = e.clientY >= midY;

        const container = element.parentElement;
        const items = Array.from(container.querySelectorAll('.ordering-item'));
        let targetIndex = items.indexOf(element);

        if (insertAfter) {
            targetIndex++;
        }

        this.moveItem(itemId, fromSection, targetSectionId, targetIndex);
    },

    /**
     * Handle section drop
     */
    handleSectionDrop(e, element, targetSectionId) {
        e.preventDefault();
        element.classList.remove('drag-over');

        if (this.dragType !== 'section' || !this.draggedElement) return;

        const sourceSectionId = this.draggedElement.dataset.sectionId;
        if (sourceSectionId === targetSectionId) return;

        this.moveSection(sourceSectionId, targetSectionId);
    },

    /**
     * Move an item to a new position
     */
    moveItem(itemId, fromSection, toSection, targetIndex) {
        // Initialize section orders if needed
        if (!this.itemOrder[fromSection]) {
            this.itemOrder[fromSection] = [];
        }
        if (!this.itemOrder[toSection]) {
            this.itemOrder[toSection] = [];
        }

        // Remove from source
        const sourceIndex = this.itemOrder[fromSection].indexOf(itemId);
        if (sourceIndex > -1) {
            this.itemOrder[fromSection].splice(sourceIndex, 1);
        }

        // Add to target
        if (targetIndex === -1 || targetIndex >= this.itemOrder[toSection].length) {
            this.itemOrder[toSection].push(itemId);
        } else {
            this.itemOrder[toSection].splice(targetIndex, 0, itemId);
        }

        this.saveOrder();
        this.notifyOrderChange();
    },

    /**
     * Move a section to a new position
     */
    moveSection(sourceSectionId, targetSectionId) {
        const sourceIndex = this.sectionOrder.indexOf(sourceSectionId);
        const targetIndex = this.sectionOrder.indexOf(targetSectionId);

        if (sourceIndex === -1 || targetIndex === -1) return;
        if (sourceIndex === targetIndex) return;

        // Remove from source position
        this.sectionOrder.splice(sourceIndex, 1);

        // Adjust target index if source was before target (array shifted)
        const adjustedTarget = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;

        // Insert at adjusted target position
        this.sectionOrder.splice(adjustedTarget, 0, sourceSectionId);

        this.saveOrder();
        this.notifyOrderChange();
    },

    /**
     * Get the index for dropping at a position
     */
    getDropIndex(container, clientY) {
        const items = Array.from(container.querySelectorAll('.ordering-item:not(.dragging)'));

        for (let i = 0; i < items.length; i++) {
            const rect = items[i].getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            if (clientY < midY) {
                return i;
            }
        }

        return items.length;
    },

    /**
     * Show drop indicator
     */
    showDropIndicator(container, clientY) {
        // Remove existing indicator
        this.hideDropIndicator(container);

        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator';

        const items = Array.from(container.querySelectorAll('.ordering-item:not(.dragging)'));
        let insertBefore = null;

        for (const item of items) {
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;

            if (clientY < midY) {
                insertBefore = item;
                break;
            }
        }

        if (insertBefore) {
            container.insertBefore(indicator, insertBefore);
        } else {
            container.appendChild(indicator);
        }
    },

    /**
     * Hide drop indicator
     */
    hideDropIndicator(container) {
        const existing = container.querySelector('.drop-indicator');
        if (existing) {
            existing.remove();
        }
    },

    /**
     * Create drag ghost element
     */
    createDragGhost(element) {
        const ghost = element.cloneNode(true);
        ghost.className = 'drag-ghost';
        ghost.style.width = element.offsetWidth + 'px';
        ghost.style.position = 'fixed';
        ghost.style.top = '-1000px';
        ghost.style.left = '-1000px';
        document.body.appendChild(ghost);

        // Remove after a frame (needed for drag image)
        requestAnimationFrame(() => {
            ghost.remove();
        });
    },

    /**
     * Clean up after drag
     */
    cleanupDrag() {
        this.draggedElement = null;
        this.dragType = null;

        // Remove all drag classes
        document.querySelectorAll('.dragging, .drag-over, .drop-above, .drop-below').forEach(el => {
            el.classList.remove('dragging', 'drag-over', 'drop-above', 'drop-below');
        });

        // Remove all drop indicators
        document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    },

    /**
     * Get current order configuration
     */
    getCurrentOrder() {
        return {
            sectionOrder: [...this.sectionOrder],
            itemOrder: JSON.parse(JSON.stringify(this.itemOrder))
        };
    },

    /**
     * Set item order for a section
     */
    setItemOrder(sectionId, itemIds) {
        this.itemOrder[sectionId] = [...itemIds];
        this.saveOrder();
    },

    /**
     * Apply order to items
     */
    applyOrder(items) {
        const orderedItems = [];

        // Group items by category
        const itemsByCategory = {};
        items.forEach(item => {
            const cat = item.category;
            if (!itemsByCategory[cat]) {
                itemsByCategory[cat] = [];
            }
            itemsByCategory[cat].push(item);
        });

        // Apply section order
        for (const section of this.sectionOrder) {
            const sectionItems = itemsByCategory[section] || [];

            // Apply item order within section
            if (this.itemOrder[section] && this.itemOrder[section].length > 0) {
                const orderedSectionItems = [];
                const itemMap = new Map(sectionItems.map(item => [item.id, item]));

                // Add items in specified order
                for (const itemId of this.itemOrder[section]) {
                    if (itemMap.has(itemId)) {
                        orderedSectionItems.push(itemMap.get(itemId));
                        itemMap.delete(itemId);
                    }
                }

                // Add remaining items (not in order list)
                itemMap.forEach(item => orderedSectionItems.push(item));

                orderedItems.push(...orderedSectionItems);
            } else {
                orderedItems.push(...sectionItems);
            }
        }

        return orderedItems;
    },

    /**
     * Save order to storage
     */
    saveOrder() {
        const orderData = {
            sectionOrder: this.sectionOrder,
            itemOrder: this.itemOrder,
            savedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem('rais2_newsletter_order', JSON.stringify(orderData));
        } catch (error) {
            console.error('Failed to save order:', error);
        }
    },

    /**
     * Load order from storage
     */
    loadOrder() {
        try {
            const saved = localStorage.getItem('rais2_newsletter_order');
            if (saved) {
                const data = JSON.parse(saved);
                this.sectionOrder = data.sectionOrder || ['news', 'event', 'lecture', 'publication', 'member', 'project'];
                this.itemOrder = data.itemOrder || {};
            }
        } catch (error) {
            console.error('Failed to load order:', error);
            this.sectionOrder = ['news', 'event', 'lecture', 'publication', 'member', 'project'];
            this.itemOrder = {};
        }
    },

    /**
     * Reset order to default
     */
    resetOrder() {
        this.sectionOrder = ['news', 'event', 'lecture', 'publication', 'member', 'project'];
        this.itemOrder = {};
        this.saveOrder();
        this.notifyOrderChange();
    },

    /**
     * Notify about order change
     */
    notifyOrderChange() {
        if (this.onOrderChange) {
            this.onOrderChange(this.getCurrentOrder());
        }

        // Dispatch event for other modules
        window.dispatchEvent(new CustomEvent('orderChange', {
            detail: this.getCurrentOrder()
        }));
    }
};

// Export for use in other modules
window.DragDropManager = DragDropManager;
