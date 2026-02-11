/**
 * AI Chat Module
 * Integrates with Grok via Puter.js for free AI assistance
 */

const AIChat = {
    // Chat state
    messages: [],
    isTyping: false,
    puterLoaded: false,
    settings: null,

    // Default system prompt (fallback)
    DEFAULT_SYSTEM_PROMPT: `You are an AI assistant for the RAIS² Newsletter builder at the University of Bayreuth.
You help create professional, engaging content for academic newsletters about AI research.

Guidelines:
- Keep tone professional but accessible
- Match UBT corporate communication style
- Be concise for newsletter content (2-3 sentences max for descriptions)
- Focus on AI research and academic events
- Use active voice
- Avoid jargon unless necessary

When writing newsletter content:
- Intros should be welcoming and highlight key updates
- Event descriptions should include what, when, and why it matters
- Keep summaries scannable and informative`,

    // Quick action prompts
    QUICK_ACTIONS: {
        'write-intro': 'Write a professional newsletter introduction for RAIS² that welcomes readers and highlights this edition\'s content.',
        'summarize': 'Summarize the following content in 2-3 concise sentences suitable for a newsletter:',
        'enhance': 'Enhance and improve the following text while keeping it professional and concise:',
        'event-desc': 'Write a compelling event description (2-3 sentences) for the following event:'
    },

    /**
     * Initialize the AI chat module
     */
    async init() {
        this.loadSettings();
        this.loadChatHistory();
        this.setupEventListeners();

        // Only load Puter.js if using that provider
        if (this.settings.provider === 'puter') {
            await this.loadPuter();
        }

        this.renderMessages();
        this.updateProviderIndicator();
        this.restorePanelState();
    },

    /**
     * Restore panel open/closed state from localStorage
     */
    restorePanelState() {
        const savedState = localStorage.getItem('rais2_ai_panel_open');
        if (savedState === 'true') {
            const panel = document.getElementById('aiChatPanel');
            const toggleBtn = document.getElementById('aiToggleBtn');
            const layout = document.querySelector('.builder-layout-enhanced');

            if (panel) {
                panel.classList.add('open');
                if (toggleBtn) toggleBtn.classList.add('hidden');
                if (layout) layout.classList.add('chat-open');
            }
        }
    },

    /**
     * Save panel state to localStorage
     */
    savePanelState(isOpen) {
        localStorage.setItem('rais2_ai_panel_open', isOpen ? 'true' : 'false');
    },

    /**
     * Load AI settings from storage
     */
    loadSettings() {
        if (window.StorageManager) {
            this.settings = StorageManager.getAISettings();
        } else {
            // Fallback defaults
            this.settings = {
                provider: 'puter',
                apiKey: '',
                model: 'grok-beta',
                systemPrompt: this.DEFAULT_SYSTEM_PROMPT
            };
        }
    },

    /**
     * Get current system prompt
     */
    getSystemPrompt() {
        return this.settings?.systemPrompt || this.DEFAULT_SYSTEM_PROMPT;
    },

    /**
     * Update provider indicator in chat header
     */
    updateProviderIndicator() {
        const badge = document.getElementById('aiProviderBadge');
        if (badge && this.settings) {
            const providerInfo = {
                'openrouter': { name: 'OpenRouter', class: 'openrouter' },
                'puter': { name: 'Grok', class: 'puter' },
                'openai': { name: 'OpenAI', class: 'openai' },
                'claude': { name: 'Claude', class: 'claude' }
            };
            const info = providerInfo[this.settings.provider] || { name: 'AI', class: '' };
            badge.textContent = info.name;
            badge.className = `ai-provider-badge ${info.class}`;

            // Show model name for free models
            if (this.settings.provider === 'openrouter' && this.settings.model?.includes(':free')) {
                const modelName = this.settings.model.split('/')[1]?.split(':')[0] || '';
                if (modelName) {
                    badge.textContent = modelName.split('-').slice(0, 2).join(' ');
                }
            }
        }
    },

    /**
     * Load Puter.js library
     */
    async loadPuter() {
        if (this.puterLoaded) return true;

        return new Promise((resolve) => {
            // Check if already loaded
            if (window.puter) {
                this.puterLoaded = true;
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://js.puter.com/v2/';
            script.onload = () => {
                this.puterLoaded = true;
                console.log('Puter.js loaded successfully');
                resolve(true);
            };
            script.onerror = () => {
                console.error('Failed to load Puter.js');
                resolve(false);
            };
            document.head.appendChild(script);
        });
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Chat toggle button
        const toggleBtn = document.getElementById('aiToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.togglePanel());
        }

        // Close button
        const closeBtn = document.getElementById('aiChatClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closePanel());
        }

        // Clear history button
        const clearBtn = document.getElementById('aiClearHistoryBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.confirmClearHistory());
        }

        // Send button
        const sendBtn = document.getElementById('aiSendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Input field
        const input = document.getElementById('aiInput');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize textarea
            input.addEventListener('input', () => {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            });
        }

        // Quick action buttons
        document.querySelectorAll('.ai-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });
    },

    /**
     * Toggle chat panel
     */
    togglePanel() {
        const panel = document.getElementById('aiChatPanel');
        const toggleBtn = document.getElementById('aiToggleBtn');
        const layout = document.querySelector('.builder-layout-enhanced');

        if (panel) {
            const isOpen = panel.classList.toggle('open');
            if (toggleBtn) {
                toggleBtn.classList.toggle('hidden', isOpen);
            }
            if (layout) {
                layout.classList.toggle('chat-open', isOpen);
            }

            this.savePanelState(isOpen);

            if (isOpen) {
                document.getElementById('aiInput')?.focus();
            }
        }
    },

    /**
     * Close chat panel
     */
    closePanel() {
        const panel = document.getElementById('aiChatPanel');
        const toggleBtn = document.getElementById('aiToggleBtn');
        const layout = document.querySelector('.builder-layout-enhanced');

        if (panel) {
            panel.classList.remove('open');
        }
        if (toggleBtn) {
            toggleBtn.classList.remove('hidden');
        }
        if (layout) {
            layout.classList.remove('chat-open');
        }
        this.savePanelState(false);
    },

    /**
     * Send a message to the AI
     */
    async sendMessage(overrideText = null) {
        const input = document.getElementById('aiInput');
        const text = overrideText || input?.value?.trim();

        if (!text || this.isTyping) return;

        // Clear input
        if (input && !overrideText) {
            input.value = '';
            input.style.height = 'auto';
        }

        // Add user message
        this.addMessage('user', text);

        // Show typing indicator
        this.setTyping(true);

        try {
            // Send to AI (provider based on settings)
            const response = await this.callAI(text);
            this.addMessage('assistant', response);
        } catch (error) {
            console.error('AI Chat error:', error);
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        } finally {
            this.setTyping(false);
        }
    },

    /**
     * Call AI API based on current provider
     */
    async callAI(userMessage) {
        // Reload settings in case they changed
        this.loadSettings();

        const provider = this.settings.provider;

        switch (provider) {
            case 'openrouter':
                return await this.callOpenRouter(userMessage);
            case 'puter':
                return await this.callPuter(userMessage);
            case 'openai':
                return await this.callOpenAI(userMessage);
            case 'claude':
                return await this.callClaude(userMessage);
            default:
                return await this.callOpenRouter(userMessage);
        }
    },

    /**
     * Call OpenRouter API (Free models available)
     */
    async callOpenRouter(userMessage) {
        const apiKey = this.settings.apiKey;
        const model = this.settings.model || 'meta-llama/llama-4-maverick:free';
        const isFreeModel = model.includes(':free');

        // Build messages array
        const messages = [
            { role: 'system', content: this.getSystemPrompt() },
            ...this.messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: 'user', content: userMessage }
        ];

        // Build headers
        const headers = {
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'RAIS2 Newsletter'
        };

        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'OpenRouter API request failed');
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response from OpenRouter';
        } catch (error) {
            console.error('OpenRouter API error:', error);
            if (error.message.includes('rate limit') || error.message.includes('429')) {
                return "Rate limit reached. Please wait a moment and try again, or switch to a different model.";
            }
            return `OpenRouter error: ${error.message}`;
        }
    },

    /**
     * Call Grok API via Puter.js (Free)
     */
    async callPuter(userMessage) {
        if (!this.puterLoaded) {
            await this.loadPuter();
        }

        if (!window.puter) {
            throw new Error('Puter.js not available');
        }

        // Build messages array for context
        const contextMessages = this.messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Add the new user message
        contextMessages.push({
            role: 'user',
            content: userMessage
        });

        try {
            const response = await puter.ai.chat(contextMessages, {
                model: this.settings.model || 'grok-beta',
                systemPrompt: this.getSystemPrompt()
            });

            // Handle different response formats
            if (typeof response === 'string') {
                return response;
            } else if (response?.message?.content) {
                return response.message.content;
            } else if (response?.content) {
                return response.content;
            } else {
                return String(response);
            }
        } catch (error) {
            console.error('Puter API error:', error);
            return "I'm having trouble connecting to the AI service. This might be due to rate limiting or network issues. Please try again in a moment.";
        }
    },

    /**
     * Call OpenAI API
     */
    async callOpenAI(userMessage) {
        const apiKey = this.settings.apiKey;
        if (!apiKey) {
            return "OpenAI API key not configured. Please go to Settings to add your API key.";
        }

        // Build messages array
        const messages = [
            { role: 'system', content: this.getSystemPrompt() },
            ...this.messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: 'user', content: userMessage }
        ];

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: this.settings.model || 'gpt-4o-mini',
                    messages: messages,
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'OpenAI API request failed');
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response from OpenAI';
        } catch (error) {
            console.error('OpenAI API error:', error);
            return `OpenAI error: ${error.message}`;
        }
    },

    /**
     * Call Claude/Anthropic API
     */
    async callClaude(userMessage) {
        const apiKey = this.settings.apiKey;
        if (!apiKey) {
            return "**Anthropic API key not configured.**\n\nPlease go to Settings to add your API key, or consider using one of these alternatives:\n\n- **OpenRouter** (Free) - Access Claude via OpenRouter's API\n- **Puter.js** (Free) - Access Grok for free";
        }

        // Build messages array
        const messages = this.messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        messages.push({ role: 'user', content: userMessage });

        try {
            // Note: Direct Claude API calls from browser have CORS issues
            // This would typically need a proxy server
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: this.settings.model || 'claude-3-5-sonnet-20241022',
                    max_tokens: 1000,
                    system: this.getSystemPrompt(),
                    messages: messages
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Claude API request failed');
            }

            const data = await response.json();
            return data.content?.[0]?.text || 'No response from Claude';
        } catch (error) {
            console.error('Claude API error:', error);
            if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                return `**Unable to connect to Claude API**\n\nDirect browser access to the Anthropic API is blocked by CORS security policies. This is a browser limitation, not a problem with your API key.\n\n**Recommended alternatives:**\n\n1. **OpenRouter** (Best option) - Use Claude through OpenRouter. Select "OpenRouter" as provider and choose "Claude 3.5 Sonnet" model.\n\n2. **Puter.js** - Free access to Grok AI, no API key needed.\n\n3. **Free models** - OpenRouter offers many free models like Llama 4, DeepSeek, and Gemini.\n\nClick the ⚙️ settings icon above to switch providers.`;
            }
            if (error.message.includes('rate limit') || error.message.includes('429')) {
                return "**Rate limit reached.** Please wait a moment before trying again, or switch to a different provider.";
            }
            return `**Claude error:** ${error.message}`;
        }
    },

    /**
     * Add a message to the chat
     */
    addMessage(role, content, isError = false) {
        const message = {
            id: this.generateId(),
            role,
            content,
            timestamp: new Date().toISOString(),
            isError
        };

        this.messages.push(message);
        this.saveChatHistory();
        this.renderMessages();
        this.scrollToBottom();
    },

    /**
     * Handle quick action buttons
     */
    handleQuickAction(action) {
        const prompt = this.QUICK_ACTIONS[action];
        if (!prompt) return;

        // For actions that need context, check for selected content
        const selectedText = window.getSelection()?.toString()?.trim();

        if (action === 'summarize' || action === 'enhance') {
            if (selectedText) {
                this.sendMessage(`${prompt}\n\n"${selectedText}"`);
            } else {
                // Show message in input for user to add content
                const input = document.getElementById('aiInput');
                if (input) {
                    input.value = prompt + '\n\n';
                    input.focus();
                }
            }
        } else {
            this.sendMessage(prompt);
        }
    },

    /**
     * Generate description for an item
     */
    async generateItemDescription(item) {
        const prompt = `Write a compelling, concise description (2-3 sentences) for this ${item.category}:

Title: ${item.title}
Date: ${item.date}
${item.summary ? `Current summary: ${item.summary}` : ''}

Focus on why this is relevant and what readers can expect.`;

        this.togglePanel();
        await this.sendMessage(prompt);
    },

    /**
     * Generate intro for a custom block
     */
    async generateBlockContent(blockType, context = {}) {
        let prompt = '';

        switch (blockType) {
            case 'newsletter-intro':
                prompt = 'Write a welcoming newsletter introduction for RAIS² (2-3 sentences). Make it professional yet engaging.';
                break;
            case 'section-intro':
                prompt = `Write a brief introduction (1-2 sentences) for the ${context.section || 'upcoming'} section of the newsletter.`;
                break;
            default:
                prompt = 'Write a short, engaging paragraph for the newsletter.';
        }

        this.togglePanel();
        await this.sendMessage(prompt);
    },

    /**
     * Set typing indicator state with enhanced animation
     */
    setTyping(isTyping) {
        this.isTyping = isTyping;
        const messagesContainer = document.getElementById('aiChatMessages');
        const sendBtn = document.getElementById('aiSendBtn');

        // Remove existing typing indicator
        const existingIndicator = document.querySelector('.ai-typing-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Clear timer
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
            this.typingTimer = null;
        }

        if (isTyping && messagesContainer) {
            const startTime = Date.now();
            const indicator = document.createElement('div');
            indicator.className = 'ai-typing-indicator';
            indicator.innerHTML = `
                <div class="ai-typing-content">
                    <div class="ai-thinking-animation">
                        <span></span><span></span><span></span>
                    </div>
                    <span class="ai-typing-text">Thinking...</span>
                    <span class="ai-typing-time"></span>
                </div>
            `;
            messagesContainer.appendChild(indicator);

            // Update elapsed time
            const timeEl = indicator.querySelector('.ai-typing-time');
            this.typingTimer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                if (elapsed >= 3) {
                    timeEl.textContent = `${elapsed}s`;
                }
            }, 1000);
        }

        if (sendBtn) {
            sendBtn.disabled = isTyping;
        }

        if (isTyping) {
            this.scrollToBottom();
        }
    },

    // Timer for typing indicator
    typingTimer: null,

    /**
     * Render all messages
     */
    renderMessages() {
        const container = document.getElementById('aiChatMessages');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="ai-welcome" style="text-align: center; padding: 40px 20px; color: var(--ubt-medium-gray);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.5; margin-bottom: 16px;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                    </svg>
                    <p style="margin: 0; font-size: 14px;">Ask me to help write intros, summarize content, or enhance descriptions!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.messages.map(msg => this.renderMessage(msg)).join('');
    },

    /**
     * Render a single message
     */
    renderMessage(message) {
        const isAssistant = message.role === 'assistant';
        const isError = message.isError;
        const formattedContent = isAssistant ? this.formatMarkdown(message.content) : this.escapeHtml(message.content);
        const timestamp = this.formatTimestamp(message.timestamp);

        let actionsHtml = '';
        if (isAssistant && !isError) {
            actionsHtml = `
                <div class="ai-message-actions">
                    <button class="ai-action-btn" onclick="AIChat.copyMessage('${message.id}')" title="Copy to clipboard">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        Copy
                    </button>
                    <button class="ai-action-btn" onclick="AIChat.regenerateMessage('${message.id}')" title="Regenerate response">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                        Regenerate
                    </button>
                    <button class="ai-action-btn ai-action-primary" onclick="AIChat.useAsContent('${message.id}')" title="Use in newsletter">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z"/></svg>
                        Use
                    </button>
                </div>
            `;
        } else if (isError) {
            actionsHtml = `
                <div class="ai-message-actions">
                    <button class="ai-action-btn ai-retry-btn" onclick="AIChat.retryLastMessage()" title="Retry">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                        Retry
                    </button>
                </div>
            `;
        }

        const errorClass = isError ? ' ai-message-error' : '';

        return `
            <div class="ai-message ${message.role}${errorClass}" data-id="${message.id}">
                <div class="ai-message-content">
                    ${formattedContent}
                </div>
                <div class="ai-message-meta">
                    <span class="ai-message-timestamp" title="${new Date(message.timestamp).toLocaleString()}">${timestamp}</span>
                </div>
                ${actionsHtml}
            </div>
        `;
    },

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    },

    /**
     * Regenerate the last assistant message
     */
    async regenerateMessage(messageId) {
        // Find the user message before this assistant message
        const msgIndex = this.messages.findIndex(m => m.id === messageId);
        if (msgIndex <= 0) return;

        // Find the preceding user message
        let userMessage = null;
        for (let i = msgIndex - 1; i >= 0; i--) {
            if (this.messages[i].role === 'user') {
                userMessage = this.messages[i].content;
                break;
            }
        }

        if (!userMessage) return;

        // Remove the old assistant message
        this.messages = this.messages.filter(m => m.id !== messageId);
        this.saveChatHistory();
        this.renderMessages();

        // Re-send the user message
        this.setTyping(true);
        try {
            const response = await this.callAI(userMessage);
            this.addMessage('assistant', response);
        } catch (error) {
            this.addMessage('assistant', 'Failed to regenerate. Please try again.', true);
        } finally {
            this.setTyping(false);
        }
    },

    /**
     * Retry the last failed message
     */
    async retryLastMessage() {
        // Find the last user message
        let lastUserMessage = null;
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].role === 'user') {
                lastUserMessage = this.messages[i].content;
                break;
            }
        }

        if (!lastUserMessage) return;

        // Remove the error message
        const lastMsg = this.messages[this.messages.length - 1];
        if (lastMsg && lastMsg.isError) {
            this.messages.pop();
            this.saveChatHistory();
            this.renderMessages();
        }

        // Retry
        this.setTyping(true);
        try {
            const response = await this.callAI(lastUserMessage);
            this.addMessage('assistant', response);
        } catch (error) {
            this.addMessage('assistant', 'Still having trouble connecting. Please check your settings or try a different provider.', true);
        } finally {
            this.setTyping(false);
        }
    },

    /**
     * Copy message content
     */
    async copyMessage(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;

        try {
            await navigator.clipboard.writeText(message.content);
            if (window.App) {
                App.showToast('Copied to clipboard!', 'success');
            }
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    },

    /**
     * Use message content in newsletter
     */
    useAsContent(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;

        // Dispatch event for other modules to handle
        window.dispatchEvent(new CustomEvent('aiContentReady', {
            detail: { content: message.content }
        }));

        if (window.App) {
            App.showToast('Content ready to use!', 'success');
        }
    },

    /**
     * Format markdown to HTML with enhanced parsing
     */
    formatMarkdown(text) {
        // Escape HTML first
        let html = this.escapeHtml(text);

        // Code blocks (triple backticks)
        html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
            return `<div class="ai-code-block">
                <div class="ai-code-header">
                    <span>${lang || 'code'}</span>
                    <button class="ai-code-copy-btn" onclick="AIChat.copyCode(this)">Copy</button>
                </div>
                <pre><code>${code.trim()}</code></pre>
            </div>`;
        });

        // Inline code (single backticks)
        html = html.replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Bullet lists
        html = html.replace(/^[\s]*[-•]\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul class="ai-list">$&</ul>');

        // Numbered lists
        html = html.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, '<li>$2</li>');

        // Headers
        html = html.replace(/^###\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^##\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^#\s+(.+)$/gm, '<h2>$1</h2>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Auto-link URLs
        html = html.replace(/(^|[^"'])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');

        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        html = '<p>' + html + '</p>';

        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<[hul])/g, '$1');
        html = html.replace(/(<\/[hul]\d?>)<\/p>/g, '$1');

        return html;
    },

    /**
     * Copy code from code block
     */
    copyCode(button) {
        const codeBlock = button.closest('.ai-code-block');
        const code = codeBlock.querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => {
            button.textContent = 'Copied!';
            setTimeout(() => { button.textContent = 'Copy'; }, 2000);
        });
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        const container = document.getElementById('aiChatMessages');
        if (container) {
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);
        }
    },

    /**
     * Save chat history to session storage
     */
    saveChatHistory() {
        try {
            sessionStorage.setItem('rais2_ai_chat_history', JSON.stringify(this.messages));
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    },

    /**
     * Load chat history from session storage
     */
    loadChatHistory() {
        try {
            const saved = sessionStorage.getItem('rais2_ai_chat_history');
            if (saved) {
                this.messages = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
            this.messages = [];
        }
    },

    /**
     * Show confirmation before clearing history
     */
    confirmClearHistory() {
        if (this.messages.length === 0) {
            if (window.App) {
                App.showToast('Chat history is already empty', 'info');
            }
            return;
        }

        if (confirm('Clear all chat history? This cannot be undone.')) {
            this.clearHistory();
            if (window.App) {
                App.showToast('Chat history cleared', 'success');
            }
        }
    },

    /**
     * Clear chat history
     */
    clearHistory() {
        this.messages = [];
        this.saveChatHistory();
        this.renderMessages();
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
};

// Export for use in other modules
window.AIChat = AIChat;
