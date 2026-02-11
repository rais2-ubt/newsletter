/**
 * Tracker Module
 * Handles tracking of seen items and duplicate detection
 */

const ItemTracker = {
    /**
     * Get all seen items
     * @returns {Object} Seen items data
     */
    getSeenItems() {
        return StorageManager.getSeenItems();
    },

    /**
     * Check if an item has been seen
     * @param {string} itemId - Item ID
     * @returns {boolean} True if seen
     */
    isItemSeen(itemId) {
        return StorageManager.isItemSeen(itemId);
    },

    /**
     * Filter items to only new ones
     * @param {Array} items - All items
     * @returns {Array} New items only
     */
    filterNewItems(items) {
        const seen = this.getSeenItems();
        return items.filter(item => !(item.id in seen.items));
    },

    /**
     * Mark items as seen
     * @param {Array} items - Items to mark
     */
    markAsSeen(items) {
        StorageManager.markItemsSeen(items);
    },

    /**
     * Clear all history
     */
    clearHistory() {
        StorageManager.clearSeenItems();
    },

    /**
     * Get statistics about seen items
     * @returns {Object} Statistics
     */
    getStats() {
        const data = this.getSeenItems();
        const items = Object.values(data.items);

        return {
            total: items.length,
            lastCheck: data.lastCheck ? new Date(data.lastCheck) : null,
            byCategory: this.countByCategory(items)
        };
    },

    /**
     * Count items by inferred category
     * @param {Array} items - Items
     * @returns {Object} Counts by category
     */
    countByCategory(items) {
        // Since we don't store category in seen items,
        // this would need enhancement if needed
        return {
            total: items.length
        };
    },

    /**
     * Get recently seen items
     * @param {number} limit - Max items to return
     * @returns {Array} Recent items
     */
    getRecentlySeen(limit = 10) {
        const data = this.getSeenItems();
        return Object.entries(data.items)
            .map(([id, item]) => ({ id, ...item }))
            .sort((a, b) => new Date(b.seenAt) - new Date(a.seenAt))
            .slice(0, limit);
    },

    /**
     * Check if we have any history
     * @returns {boolean} True if history exists
     */
    hasHistory() {
        const data = this.getSeenItems();
        return Object.keys(data.items).length > 0;
    }
};

// Export for use in other modules
window.ItemTracker = ItemTracker;
