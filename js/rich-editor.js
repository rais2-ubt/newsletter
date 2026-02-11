/**
 * Rich Editor Module
 * Lightweight contenteditable-based rich text editor
 */

const RichEditor = {
    // Active editors
    editors: new Map(),

    /**
     * Create a new editor instance
     */
    create(container, options = {}) {
        const id = options.id || this.generateId();

        const editor = document.createElement('div');
        editor.className = 'rich-editor';
        editor.innerHTML = `
            <div class="rich-editor-toolbar">
                <button type="button" data-command="bold" title="Bold (Ctrl+B)">
                    <strong>B</strong>
                </button>
                <button type="button" data-command="italic" title="Italic (Ctrl+I)">
                    <em>I</em>
                </button>
                <button type="button" data-command="underline" title="Underline (Ctrl+U)">
                    <u>U</u>
                </button>
                <span class="toolbar-divider"></span>
                <button type="button" data-command="insertUnorderedList" title="Bullet List">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                    </svg>
                </button>
                <button type="button" data-command="insertOrderedList" title="Numbered List">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
                    </svg>
                </button>
                <span class="toolbar-divider"></span>
                <button type="button" data-command="createLink" title="Insert Link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                    </svg>
                </button>
                <button type="button" data-command="removeFormat" title="Clear Formatting">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z"/>
                    </svg>
                </button>
                ${options.showAIButton !== false ? `
                <span class="toolbar-divider"></span>
                <button type="button" data-command="ai-enhance" class="ai-btn" title="AI Enhance">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
                    </svg>
                </button>
                ` : ''}
            </div>
            <div class="rich-editor-content"
                 contenteditable="true"
                 data-placeholder="${options.placeholder || 'Enter text...'}"
                 id="${id}-content">
            </div>
        `;

        container.appendChild(editor);

        // Get content element
        const content = editor.querySelector('.rich-editor-content');

        // Set initial content
        if (options.content) {
            content.innerHTML = options.content;
        }

        // Setup toolbar
        this.setupToolbar(editor, content, options);

        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts(content);

        // Create editor instance
        const instance = {
            id,
            element: editor,
            content,
            getHTML: () => content.innerHTML,
            setHTML: (html) => { content.innerHTML = html; },
            getPlainText: () => content.textContent,
            focus: () => content.focus(),
            isEmpty: () => !content.textContent.trim(),
            destroy: () => this.destroy(id)
        };

        // Store instance
        this.editors.set(id, instance);

        // Setup change callback
        if (options.onChange) {
            content.addEventListener('input', () => {
                options.onChange(content.innerHTML);
            });
        }

        return instance;
    },

    /**
     * Setup toolbar buttons
     */
    setupToolbar(editor, content, options) {
        const toolbar = editor.querySelector('.rich-editor-toolbar');

        toolbar.querySelectorAll('button[data-command]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.dataset.command;

                // Focus content first
                content.focus();

                if (command === 'ai-enhance') {
                    this.handleAIEnhance(content, options);
                } else if (command === 'createLink') {
                    this.handleCreateLink(content);
                } else {
                    document.execCommand(command, false, null);
                }

                // Update active states
                this.updateActiveStates(toolbar);
            });
        });

        // Update active states on selection change
        content.addEventListener('mouseup', () => this.updateActiveStates(toolbar));
        content.addEventListener('keyup', () => this.updateActiveStates(toolbar));
    },

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts(content) {
        content.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        document.execCommand('bold', false, null);
                        break;
                    case 'i':
                        e.preventDefault();
                        document.execCommand('italic', false, null);
                        break;
                    case 'u':
                        e.preventDefault();
                        document.execCommand('underline', false, null);
                        break;
                    case 'k':
                        e.preventDefault();
                        this.handleCreateLink(content);
                        break;
                }
            }
        });
    },

    /**
     * Handle create link command
     */
    handleCreateLink(content) {
        const selection = window.getSelection();
        const selectedText = selection.toString();

        if (!selectedText) {
            if (window.App) {
                App.showToast('Select text first to create a link', 'error');
            }
            return;
        }

        const url = prompt('Enter URL:', 'https://');
        if (url) {
            document.execCommand('createLink', false, url);

            // Make links open in new tab
            const links = content.querySelectorAll('a');
            links.forEach(link => {
                if (!link.hasAttribute('target')) {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                }
            });
        }
    },

    /**
     * Handle AI enhance
     */
    handleAIEnhance(content, options) {
        const text = content.innerHTML;

        if (!text.trim()) {
            if (window.App) {
                App.showToast('Enter some text first', 'error');
            }
            return;
        }

        // If AIChat is available, use it
        if (window.AIChat) {
            const plainText = content.textContent;
            AIChat.togglePanel();
            AIChat.sendMessage(`Enhance and improve this text while keeping it professional and concise for a newsletter:\n\n"${plainText}"`);

            // Listen for AI content ready
            const handler = (e) => {
                if (options.onAIContent) {
                    options.onAIContent(e.detail.content);
                }
                window.removeEventListener('aiContentReady', handler);
            };
            window.addEventListener('aiContentReady', handler);
        } else if (options.onAIEnhance) {
            options.onAIEnhance(text);
        }
    },

    /**
     * Update active states of toolbar buttons
     */
    updateActiveStates(toolbar) {
        const commands = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList'];

        commands.forEach(command => {
            const btn = toolbar.querySelector(`[data-command="${command}"]`);
            if (btn) {
                const isActive = document.queryCommandState(command);
                btn.classList.toggle('active', isActive);
            }
        });
    },

    /**
     * Get editor instance by ID
     */
    get(id) {
        return this.editors.get(id);
    },

    /**
     * Destroy editor instance
     */
    destroy(id) {
        const instance = this.editors.get(id);
        if (instance) {
            instance.element.remove();
            this.editors.delete(id);
        }
    },

    /**
     * Destroy all editors
     */
    destroyAll() {
        this.editors.forEach((instance, id) => {
            this.destroy(id);
        });
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return 'editor-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    /**
     * Convert HTML to plain text
     */
    htmlToPlainText(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },

    /**
     * Sanitize HTML (basic)
     */
    sanitizeHTML(html) {
        const allowed = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li'];
        const div = document.createElement('div');
        div.innerHTML = html;

        // Remove disallowed tags
        const allElements = div.getElementsByTagName('*');
        for (let i = allElements.length - 1; i >= 0; i--) {
            const el = allElements[i];
            if (!allowed.includes(el.tagName.toLowerCase())) {
                // Replace with text content
                const text = document.createTextNode(el.textContent);
                el.parentNode.replaceChild(text, el);
            }
        }

        return div.innerHTML;
    }
};

// Export for use in other modules
window.RichEditor = RichEditor;
