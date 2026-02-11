/**
 * Newsletter Generator Module
 * Generates HTML newsletters with UBT Corporate Design
 */

const NewsletterGenerator = {
    // UBT Corporate Design Colors
    COLORS: {
        green: '#009260',
        greenDark: '#007a4f',
        greenLight: '#e6f4ef',
        darkGray: '#48535A',
        mediumGray: '#7F8990',
        lightGray: '#EBEBE4',
        white: '#FFFFFF'
    },

    // Category colors
    CATEGORY_COLORS: {
        news: { bg: '#e8f5e9', text: '#2e7d32' },
        event: { bg: '#e3f2fd', text: '#1565c0' },
        lecture: { bg: '#fff3e0', text: '#ef6c00' },
        publication: { bg: '#f3e5f5', text: '#7b1fa2' },
        member: { bg: '#e0f7fa', text: '#00838f' },
        project: { bg: '#fce4ec', text: '#c2185b' }
    },

    // SVG Icons
    ICONS: {
        news: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3ZM19 19H5V5H19V19Z" fill="#009260"/>
            <path d="M7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill="#009260"/>
        </svg>`,
        events: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20ZM19 8H5V6H19V8Z" fill="#009260"/>
            <path d="M12 13H17V18H12V13Z" fill="#009260"/>
        </svg>`,
        lectures: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" fill="#009260"/>
            <path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" fill="#009260"/>
        </svg>`
    },

    // Divider styles
    DIVIDERS: {
        solid: (color) => `
            <tr>
                <td style="padding:15px 0;">
                    <div style="height:2px;background:${color};"></div>
                </td>
            </tr>`,
        gradient: (color) => `
            <tr>
                <td style="padding:15px 0;">
                    <div style="height:3px;background:linear-gradient(90deg, transparent, ${color}, transparent);"></div>
                </td>
            </tr>`,
        dots: (color) => `
            <tr>
                <td style="padding:15px 0;text-align:center;">
                    <span style="color:${color};letter-spacing:8px;font-size:20px;">&#8226;&#8226;&#8226;&#8226;&#8226;</span>
                </td>
            </tr>`,
        wave: (color) => `
            <tr>
                <td style="padding:15px 0;text-align:center;">
                    <svg width="100" height="20" viewBox="0 0 100 20" style="display:inline-block;">
                        <path d="M0 10 Q 12.5 0, 25 10 T 50 10 T 75 10 T 100 10" stroke="${color}" stroke-width="2" fill="none"/>
                    </svg>
                </td>
            </tr>`
    },

    // Callout styles with colors
    CALLOUT_STYLES: {
        info: { bg: '#e3f2fd', border: '#1565c0', icon: 'info' },
        success: { bg: '#e8f5e9', border: '#2e7d32', icon: 'check' },
        warning: { bg: '#fff3e0', border: '#ef6c00', icon: 'alert' },
        highlight: { bg: '#fff8e1', border: '#f9a825', icon: 'star' },
        rais: { bg: '#e6f4ef', border: '#009260', icon: 'rais' }
    },

    /**
     * Format date string to readable format
     * @param {string} dateStr - Date string (DD.MM.YYYY or other)
     * @returns {string} Formatted date
     */
    formatDate(dateStr) {
        const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (match) {
            const [, day, month, year] = match;
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            try {
                const monthName = months[parseInt(month) - 1];
                return `${parseInt(day)} ${monthName} ${year}`;
            } catch (e) {
                return dateStr;
            }
        }
        return dateStr;
    },

    /**
     * Calculate reading time
     * @param {Array} items - Newsletter items
     * @returns {number} Reading time in minutes
     */
    calculateReadingTime(items) {
        let totalWords = 0;
        items.forEach(item => {
            totalWords += item.title.split(' ').length;
            if (item.summary) {
                totalWords += item.summary.split(' ').length;
            }
        });
        return Math.max(2, Math.floor(totalWords / 200) + 2);
    },

    /**
     * Render a single item card
     * @param {Object} item - Item data
     * @returns {string} HTML string
     */
    renderItem(item) {
        const { green, darkGray, mediumGray, white } = this.COLORS;
        const catColor = this.CATEGORY_COLORS[item.category] || this.CATEGORY_COLORS.news;
        const formattedDate = this.formatDate(item.date);
        const summaryHtml = item.summary ?
            `<p style="margin:0 0 15px 0;color:${mediumGray};font-size:15px;line-height:1.6;">${item.summary}</p>` : '';

        return `
        <tr>
            <td style="padding:20px 30px;background:${white};border-left:4px solid ${green};margin-bottom:15px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td>
                            <span style="font-size:13px;color:${mediumGray};font-style:italic;">${formattedDate}</span>
                            <span style="display:inline-block;margin-left:10px;padding:3px 8px;background:${catColor.bg};color:${catColor.text};font-size:10px;font-weight:600;text-transform:uppercase;">${item.category}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top:10px;">
                            <a href="${item.url}" style="font-size:20px;color:${darkGray};text-decoration:none;font-weight:600;">${item.title}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top:10px;">
                            ${summaryHtml}
                            <a href="${item.url}" style="color:${green};font-size:14px;font-weight:600;text-decoration:none;">Read more →</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr><td height="15"></td></tr>
        `;
    },

    /**
     * Render a section with items
     * @param {string} category - Section category
     * @param {Array} items - Items in this section
     * @param {Object} config - Section configuration (title, subtitle)
     * @param {Object} sectionIntro - Optional section intro block
     * @param {Array} inlineBlocks - Inline blocks for this section
     * @returns {string} HTML string
     */
    renderSection(category, items, config, sectionIntro = null, inlineBlocks = []) {
        const { green, darkGray, lightGray } = this.COLORS;

        let itemsHtml = '';

        // Add section intro if exists
        if (sectionIntro && sectionIntro.content) {
            itemsHtml += this.renderCustomBlock(sectionIntro);
        }

        // Render items with inline blocks inserted at positions
        items.forEach((item, index) => {
            // Check for inline blocks that should appear before this item
            const blocksBeforeItem = inlineBlocks.filter(b =>
                b.position && b.position.afterItem === null && b.position.index === index
            );
            blocksBeforeItem.forEach(block => {
                if (block.content) {
                    itemsHtml += this.renderCustomBlock(block);
                }
            });

            // Render the item
            itemsHtml += this.renderItem(item);

            // Check for inline blocks that should appear after this item
            const blocksAfterItem = inlineBlocks.filter(b =>
                b.position && b.position.afterItem === item.id
            );
            blocksAfterItem.forEach(block => {
                if (block.content) {
                    itemsHtml += this.renderCustomBlock(block);
                }
            });
        });

        // Add any remaining inline blocks at the end
        const blocksAtEnd = inlineBlocks.filter(b =>
            !b.position || (b.position.afterItem === null && b.position.index >= items.length)
        );
        blocksAtEnd.forEach(block => {
            if (block.content) {
                itemsHtml += this.renderCustomBlock(block);
            }
        });

        return `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:30px;">
            <tr>
                <td style="padding-bottom:20px;border-bottom:1px solid ${lightGray};">
                    <h3 style="margin:0;font-size:24px;font-weight:600;color:${darkGray};">${config.title}</h3>
                    <p style="margin:5px 0 0 0;font-size:13px;font-weight:600;color:${green};text-transform:uppercase;">${config.subtitle}</p>
                </td>
            </tr>
            ${itemsHtml}
        </table>`;
    },

    /**
     * Render a custom block
     * @param {Object} block - Block data
     * @returns {string} HTML string
     */
    renderCustomBlock(block) {
        const { green, greenLight, darkGray, mediumGray, white } = this.COLORS;

        // Dispatch to specific renderer based on type
        switch (block.type) {
            case 'image':
                return this.renderImageBlock(block);
            case 'cta-button':
                return this.renderCTABlock(block);
            case 'quote':
                return this.renderQuoteBlock(block);
            case 'feature-box':
                return this.renderFeatureBlock(block);
            case 'divider':
                return this.renderDividerBlock(block);
            case 'callout':
                return this.renderCalloutBlock(block);
            default:
                // Default rendering for intro and inline blocks
                const borderStyle = block.style?.showBorder !== false ? `border-left:4px solid ${green};` : '';
                const bgColor = block.type === 'newsletter-intro' ? greenLight : white;

                return `
                <tr>
                    <td style="padding:20px 30px;background:${bgColor};${borderStyle}margin-bottom:15px;">
                        <div style="font-size:15px;color:${darkGray};line-height:1.7;">
                            ${block.content}
                        </div>
                    </td>
                </tr>
                <tr><td height="15"></td></tr>
                `;
        }
    },

    /**
     * Render logo header
     * @param {string} logoUrl - URL or path to logo
     * @param {number} maxWidth - Maximum width in pixels
     * @returns {string} HTML string
     */
    renderLogoHeader(logoUrl, maxWidth = 200) {
        return `
        <tr>
            <td align="center" style="padding:20px 40px;">
                <img src="${logoUrl}" alt="RAIS² Logo" style="max-width:${maxWidth}px;height:auto;display:block;">
            </td>
        </tr>
        `;
    },

    /**
     * Render a section divider
     * @param {string} style - Divider style (solid, gradient, dots, wave)
     * @returns {string} HTML string
     */
    renderDivider(style = 'gradient') {
        const dividerFn = this.DIVIDERS[style] || this.DIVIDERS.gradient;
        return dividerFn(this.COLORS.green);
    },

    /**
     * Render a callout box
     * @param {string} content - Callout content
     * @param {string} style - Callout style (info, success, warning, highlight, rais)
     * @param {string} title - Optional title
     * @returns {string} HTML string
     */
    renderCallout(content, style = 'info', title = '') {
        const calloutStyle = this.CALLOUT_STYLES[style] || this.CALLOUT_STYLES.info;
        const { darkGray } = this.COLORS;

        const titleHtml = title ? `<div style="font-weight:600;font-size:16px;margin-bottom:8px;color:${calloutStyle.border};">${title}</div>` : '';

        return `
        <tr>
            <td style="padding:15px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="padding:20px;background:${calloutStyle.bg};border-left:4px solid ${calloutStyle.border};border-radius:4px;">
                            ${titleHtml}
                            <div style="font-size:15px;color:${darkGray};line-height:1.6;">
                                ${content}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        `;
    },

    /**
     * Render a featured banner
     * @param {Object} item - Item to feature
     * @param {string} imageUrl - Optional background/header image
     * @returns {string} HTML string
     */
    renderFeaturedBanner(item, imageUrl = null) {
        const { green, greenDark, white, darkGray } = this.COLORS;
        const catColor = this.CATEGORY_COLORS[item.category] || this.CATEGORY_COLORS.news;

        const imageHtml = imageUrl ? `
            <tr>
                <td>
                    <img src="${imageUrl}" alt="" style="width:100%;height:180px;object-fit:cover;display:block;">
                </td>
            </tr>
        ` : '';

        return `
        <tr>
            <td style="padding:0 0 30px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${green};border-radius:8px;overflow:hidden;">
                    ${imageHtml}
                    <tr>
                        <td style="padding:30px;">
                            <span style="display:inline-block;padding:4px 12px;background:rgba(255,255,255,0.2);color:${white};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-radius:3px;margin-bottom:15px;">Featured</span>
                            <h2 style="margin:15px 0 10px;font-size:28px;font-weight:600;color:${white};">
                                <a href="${item.url}" style="color:${white};text-decoration:none;">${item.title}</a>
                            </h2>
                            <p style="margin:0 0 20px;font-size:16px;color:rgba(255,255,255,0.9);line-height:1.6;">
                                ${item.summary || ''}
                            </p>
                            <a href="${item.url}" style="display:inline-block;padding:12px 24px;background:${white};color:${green};text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;">Read More</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        `;
    },

    /**
     * Render an image block
     * @param {Object} block - Block data with image info
     * @returns {string} HTML string
     */
    renderImageBlock(block) {
        const data = block.data || {};
        const { imageUrl, altText, caption, linkUrl, alignment, maxWidth } = data;
        const { mediumGray } = this.COLORS;

        if (!imageUrl) return '';

        const alignStyle = {
            left: 'text-align:left;',
            center: 'text-align:center;',
            right: 'text-align:right;'
        }[alignment] || 'text-align:center;';

        const imgHtml = `<img src="${imageUrl}" alt="${altText || ''}" style="max-width:${maxWidth || 500}px;width:100%;height:auto;display:inline-block;border-radius:4px;">`;
        const linkedImg = linkUrl ? `<a href="${linkUrl}" style="display:inline-block;">${imgHtml}</a>` : imgHtml;
        const captionHtml = caption ? `<p style="margin:10px 0 0;font-size:13px;color:${mediumGray};font-style:italic;">${caption}</p>` : '';

        return `
        <tr>
            <td style="padding:20px 0;${alignStyle}">
                ${linkedImg}
                ${captionHtml}
            </td>
        </tr>
        `;
    },

    /**
     * Render a CTA button block
     * @param {Object} block - Block data with button info
     * @returns {string} HTML string
     */
    renderCTABlock(block) {
        const data = block.data || {};
        const { buttonText, linkUrl, variant, alignment } = data;
        const { green, greenDark, white, darkGray } = this.COLORS;

        if (!buttonText || !linkUrl) return '';

        const alignStyle = {
            left: 'text-align:left;',
            center: 'text-align:center;',
            right: 'text-align:right;'
        }[alignment] || 'text-align:center;';

        const buttonStyles = {
            primary: `background:${green};color:${white};border:2px solid ${green};`,
            secondary: `background:${white};color:${green};border:2px solid ${green};`,
            outline: `background:transparent;color:${darkGray};border:2px solid ${darkGray};`
        };

        const style = buttonStyles[variant] || buttonStyles.primary;

        return `
        <tr>
            <td style="padding:20px 0;${alignStyle}">
                <a href="${linkUrl}" style="display:inline-block;padding:14px 28px;${style}text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;">${buttonText}</a>
            </td>
        </tr>
        `;
    },

    /**
     * Render a quote block
     * @param {Object} block - Block data with quote info
     * @returns {string} HTML string
     */
    renderQuoteBlock(block) {
        const data = block.data || {};
        const { quoteText, author, authorRole, authorPhoto } = data;
        const { green, greenLight, darkGray, mediumGray } = this.COLORS;

        if (!quoteText) return '';

        const photoHtml = authorPhoto ? `
            <td width="60" valign="top">
                <img src="${authorPhoto}" alt="${author || ''}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;">
            </td>
        ` : '';

        const authorHtml = author ? `
            <table cellpadding="0" cellspacing="0" border="0" style="margin-top:15px;">
                <tr>
                    ${photoHtml}
                    <td valign="center">
                        <div style="font-weight:600;font-size:14px;color:${darkGray};">${author}</div>
                        ${authorRole ? `<div style="font-size:13px;color:${mediumGray};">${authorRole}</div>` : ''}
                    </td>
                </tr>
            </table>
        ` : '';

        return `
        <tr>
            <td style="padding:20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="padding:25px 30px;background:${greenLight};border-left:4px solid ${green};border-radius:0 4px 4px 0;">
                            <div style="font-size:24px;color:${green};line-height:1;margin-bottom:10px;">"</div>
                            <div style="font-size:17px;color:${darkGray};line-height:1.7;font-style:italic;">
                                ${quoteText}
                            </div>
                            ${authorHtml}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        `;
    },

    /**
     * Render a feature box block
     * @param {Object} block - Block data with feature info
     * @returns {string} HTML string
     */
    renderFeatureBlock(block) {
        const data = block.data || {};
        const { icon, heading, description, linkUrl, linkText } = data;
        const { green, greenLight, darkGray, mediumGray } = this.COLORS;

        if (!heading) return '';

        const iconSvgs = {
            star: '<path d="M12 2L14.09 8.26L20.18 9.27L15.54 13.97L16.82 20.02L12 17.27L7.18 20.02L8.46 13.97L3.82 9.27L9.91 8.26L12 2Z"/>',
            check: '<path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>',
            info: '<path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z"/>',
            calendar: '<path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3 4.9 3 6V20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z"/>',
            link: '<path d="M3.9 12C3.9 10.29 5.29 8.9 7 8.9H11V7H7C4.24 7 2 9.24 2 12C2 14.76 4.24 17 7 17H11V15.1H7C5.29 15.1 3.9 13.71 3.9 12ZM8 13H16V11H8V13ZM17 7H13V8.9H17C18.71 8.9 20.1 10.29 20.1 12C20.1 13.71 18.71 15.1 17 15.1H13V17H17C19.76 17 22 14.76 22 12C22 9.24 19.76 7 17 7Z"/>'
        };

        const iconPath = iconSvgs[icon] || iconSvgs.star;
        const linkHtml = linkUrl ? `<a href="${linkUrl}" style="color:${green};font-size:14px;font-weight:600;text-decoration:none;">${linkText || 'Learn more'} &rarr;</a>` : '';

        return `
        <tr>
            <td style="padding:15px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="padding:25px;background:${greenLight};border-radius:8px;">
                            <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td width="50" valign="top">
                                        <div style="width:40px;height:40px;background:${green};border-radius:50%;display:flex;align-items:center;justify-content:center;">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">${iconPath}</svg>
                                        </div>
                                    </td>
                                    <td valign="top">
                                        <h4 style="margin:0 0 8px;font-size:18px;font-weight:600;color:${darkGray};">${heading}</h4>
                                        <p style="margin:0 0 12px;font-size:14px;color:${mediumGray};line-height:1.6;">${description || ''}</p>
                                        ${linkHtml}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        `;
    },

    /**
     * Render a divider block
     * @param {Object} block - Block data with divider style
     * @returns {string} HTML string
     */
    renderDividerBlock(block) {
        const data = block.data || {};
        const style = data.dividerStyle || 'gradient';
        return this.renderDivider(style);
    },

    /**
     * Render a callout block
     * @param {Object} block - Block data with callout info
     * @returns {string} HTML string
     */
    renderCalloutBlock(block) {
        const data = block.data || {};
        const { calloutStyle, calloutTitle, calloutContent } = data;
        return this.renderCallout(calloutContent || block.content, calloutStyle || 'info', calloutTitle);
    },

    /**
     * Section configuration
     */
    SECTIONS: {
        news: { title: 'Latest News', subtitle: 'Recent announcements' },
        event: { title: 'Upcoming Events', subtitle: 'Mark your calendar' },
        lecture: { title: 'Lecture Series', subtitle: 'Expert talks' },
        publication: { title: 'New Publications', subtitle: 'Recent research output' },
        member: { title: 'Team Spotlight', subtitle: 'Meet our researchers' },
        project: { title: 'Research Projects', subtitle: 'Ongoing initiatives' }
    },

    /**
     * Generate newsletter HTML
     * @param {Array} items - Newsletter items
     * @param {Object} options - Generation options (sectionOrder, itemOrder, customBlocks, customDescriptions, showLogo, dividerStyle, featuredItemId)
     * @returns {string} Complete HTML newsletter
     */
    generate(items, options = {}) {
        const { green, greenDark, greenLight, darkGray, mediumGray, lightGray, white } = this.COLORS;
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const issueNum = now.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }).replace('/', '/');

        // Extract options
        const {
            sectionOrder = ['news', 'event', 'lecture', 'publication', 'member', 'project'],
            itemOrder = {},
            customBlocks = {},
            customDescriptions = {},
            // New graphical options
            showLogo = false,
            logoUrl = 'assets/rais2_logo.jpeg',
            dividerStyle = 'gradient',
            featuredItemId = null
        } = options;

        // Apply custom descriptions to items
        const enhancedItems = items.map(item => ({
            ...item,
            summary: customDescriptions[item.id] || item.summary
        }));

        // Group items by category
        const itemsByCategory = {
            news: enhancedItems.filter(i => i.category === 'news'),
            event: enhancedItems.filter(i => i.category === 'event'),
            lecture: enhancedItems.filter(i => i.category === 'lecture'),
            publication: enhancedItems.filter(i => i.category === 'publication'),
            member: enhancedItems.filter(i => i.category === 'member'),
            project: enhancedItems.filter(i => i.category === 'project')
        };

        // Apply item ordering within each section
        Object.keys(itemsByCategory).forEach(cat => {
            if (itemOrder[cat] && itemOrder[cat].length > 0) {
                const orderedItems = [];
                const itemMap = new Map(itemsByCategory[cat].map(item => [item.id, item]));

                // Add items in specified order
                itemOrder[cat].forEach(itemId => {
                    if (itemMap.has(itemId)) {
                        orderedItems.push(itemMap.get(itemId));
                        itemMap.delete(itemId);
                    }
                });

                // Add remaining items
                itemMap.forEach(item => orderedItems.push(item));
                itemsByCategory[cat] = orderedItems;
            }
        });

        // Build sections in order
        let sectionsHtml = '';

        // Featured banner (if an item is selected as featured)
        if (featuredItemId) {
            const featuredItem = enhancedItems.find(i => i.id === featuredItemId);
            if (featuredItem) {
                sectionsHtml += this.renderFeaturedBanner(featuredItem);
            }
        }

        // Newsletter intro block (if exists)
        if (customBlocks.newsletterIntro && customBlocks.newsletterIntro.content) {
            sectionsHtml += this.renderCustomBlock(customBlocks.newsletterIntro);
        }

        // Render sections in specified order
        let isFirstSection = true;
        for (const category of sectionOrder) {
            const categoryItems = itemsByCategory[category];
            if (!categoryItems || categoryItems.length === 0) continue;

            // Add divider between sections (not before the first one)
            if (!isFirstSection && dividerStyle && dividerStyle !== 'none') {
                sectionsHtml += this.renderDivider(dividerStyle);
            }
            isFirstSection = false;

            const sectionConfig = this.SECTIONS[category] || { title: category, subtitle: '' };

            // Section intro block (if exists)
            const sectionIntro = customBlocks.sectionIntros?.[category];

            // Inline blocks for this section
            const inlineBlocks = customBlocks.inlineBlocks?.[category] || [];

            sectionsHtml += this.renderSection(category, categoryItems, sectionConfig, sectionIntro, inlineBlocks);
        }

        // Empty state
        if (items.length === 0) {
            sectionsHtml = `<p style="text-align:center;padding:40px;color:${mediumGray};font-style:italic;">No new updates this period.</p>`;
        }

        // Logo header HTML (conditionally rendered)
        const logoHeaderHtml = showLogo ? `
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding:30px 40px 20px 40px;background-color:${white};">
                            <img src="${logoUrl}" alt="RAIS² Logo" style="max-width:200px;height:auto;display:block;">
                        </td>
                    </tr>` : '';

        // Complete HTML
        return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>RAIS² Newsletter - ${dateStr}</title>
    <style>
        body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        body { margin: 0 !important; padding: 0 !important; }
    </style>
</head>
<body style="margin:0;padding:0;background-color:${lightGray};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${lightGray};">
        <tr>
            <td align="center" style="padding:40px 20px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:${white};max-width:600px;">

                    ${logoHeaderHtml}

                    <!-- Header -->
                    <tr>
                        <td style="padding:${showLogo ? '20px' : '40px'} 40px 30px 40px;background-color:${white};">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td>
                                        <h1 style="margin:0;font-size:42px;font-weight:400;color:${darkGray};">RAIS<sup style="font-size:20px;color:${green};">²</sup></h1>
                                    </td>
                                    <td align="right" valign="top">
                                        <div style="background-color:${greenLight};padding:10px 15px;text-align:center;">
                                            <div style="font-size:11px;font-weight:600;color:${green};text-transform:uppercase;letter-spacing:1px;">Issue ${issueNum}</div>
                                            <div style="font-size:13px;color:${darkGray};font-style:italic;">${dateStr}</div>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <h2 style="margin:20px 0 10px 0;font-size:32px;font-weight:400;color:${darkGray};">Newsletter</h2>
                            <p style="margin:0;font-size:14px;font-weight:600;color:${green};">Research Center for AI in Science &amp; Society</p>
                        </td>
                    </tr>

                    <!-- Green Divider -->
                    <tr>
                        <td style="height:3px;background-color:${green};"></td>
                    </tr>

                    <!-- Intro -->
                    <tr>
                        <td style="padding:30px 40px;background-color:${lightGray};">
                            <p style="margin:0;font-size:16px;line-height:1.6;color:${darkGray};">
                                Welcome to the <strong>RAIS² Newsletter</strong>. Stay informed about the latest developments in AI research at the University of Bayreuth.
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding:30px 40px;background-color:${white};">
                            ${sectionsHtml}
                        </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                        <td align="center" style="padding:30px 40px;background-color:${lightGray};">
                            <a href="https://www.rais2.uni-bayreuth.de/en/" style="display:inline-block;padding:15px 35px;background-color:${green};color:${white};text-decoration:none;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Visit RAIS² Website</a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:30px 40px;background-color:${darkGray};">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td>
                                        <h4 style="margin:0 0 5px 0;font-size:20px;color:${white};">RAIS<sup style="color:${green};">²</sup></h4>
                                        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);">University of Bayreuth</p>
                                    </td>
                                    <td align="right">
                                        <a href="mailto:rais2@uni-bayreuth.de" style="color:${green};font-size:14px;text-decoration:none;">rais2@uni-bayreuth.de</a>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.2);">
                                <tr>
                                    <td>
                                        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.5);">© ${now.getFullYear()} RAIS² · University of Bayreuth</p>
                                    </td>
                                    <td align="right">
                                        <a href="{{unsubscribe_url}}" style="color:rgba(255,255,255,0.6);font-size:12px;text-decoration:none;">Unsubscribe</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    },

    /**
     * Generate preview HTML (for display in browser)
     * @param {Array} items - Newsletter items
     * @returns {string} Preview HTML
     */
    generatePreview(items) {
        return this.generate(items);
    },

    /**
     * Save newsletter to storage
     * @param {Array} items - Items included in newsletter
     * @param {string} html - Generated HTML
     * @param {string} title - Newsletter title
     * @returns {string} Newsletter ID
     */
    save(items, html, title = null) {
        return StorageManager.saveNewsletter({
            title: title || `Newsletter - ${new Date().toLocaleDateString()}`,
            html,
            items: items.map(i => i.id)
        });
    },

    /**
     * Download newsletter as HTML file
     * @param {string} html - Newsletter HTML
     * @param {string} filename - File name
     */
    download(html, filename = null) {
        const name = filename || `newsletter_${new Date().toISOString().slice(0, 10)}.html`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Copy HTML to clipboard
     * @param {string} html - Newsletter HTML
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(html) {
        try {
            await navigator.clipboard.writeText(html);
            return true;
        } catch (e) {
            console.error('Failed to copy to clipboard:', e);
            return false;
        }
    }
};

// Export for use in other modules
window.NewsletterGenerator = NewsletterGenerator;
