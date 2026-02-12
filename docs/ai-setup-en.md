# AI Assistant Setup

The RAIS² Newsletter Manager includes a built-in AI assistant that can help you write, enhance, and summarize newsletter content. This guide explains how to set it up.

## What the AI Can Do

- **Write Introductions**: Generate newsletter intro paragraphs
- **Summarize**: Condense long text into shorter versions
- **Enhance**: Improve existing text (better wording, structure)
- **Event Descriptions**: Generate descriptions for events and lectures
- **Custom Prompts**: Ask anything about your newsletter content

## Free Options (No API Key Needed)

### OpenRouter (Recommended)
The default provider. Offers access to high-quality AI models for free.

**Models available for free:**
- Llama 4 Maverick (400B) — Excellent for writing tasks
- Gemma 3 (27B) — Fast and capable
- DeepSeek V3 — Strong multilingual support
- Mistral Small — Good balance of speed and quality
- And more...

**Setup:**
1. Go to **Settings** → **AI Assistant**
2. Select **OpenRouter** as the provider
3. That's it! Free models work without an API key

> **Note:** Free models have usage limits. If you hit a limit, try a different free model or wait a few minutes.

### Puter.js / Grok
Completely free AI access through Puter.js. No API key, no account needed.

**Setup:**
1. Go to **Settings** → **AI Assistant**
2. Select **Puter / Grok** as the provider
3. Done! It works immediately

## Paid Options (API Key Required)

### OpenAI (GPT-4, GPT-3.5)
For the best quality results.

**How to get an API key:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account (or sign in)
3. Go to **API Keys** in your account settings
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)

**Setup in RAIS²:**
1. Go to **Settings** → **AI Assistant**
2. Select **OpenAI** as the provider
3. Paste your API key
4. Choose a model (GPT-4o recommended)

> **Pricing:** OpenAI charges per token (roughly per word). GPT-4o costs approximately $2.50-$10 per million tokens. For newsletter writing, this is very affordable — typically under $0.10 per session.

### Claude / Anthropic
Anthropic's Claude models, known for high-quality writing.

**How to get an API key:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account
3. Go to **API Keys**
4. Create a new key

**Setup in RAIS²:**
1. Go to **Settings** → **AI Assistant**
2. Select **Claude** as the provider
3. Paste your API key
4. Choose a model

> **Note:** Claude API calls from a browser may have CORS limitations. OpenRouter is recommended as it provides access to Claude models without these restrictions.

## Using the AI Chat

### Opening the Chat
Look for the **chat icon** in the bottom-right corner of the page. Click it to open the AI panel.

### Quick Actions
Four preset buttons for common tasks:
- **Write Intro** — Generates a newsletter introduction
- **Summarize** — Condenses selected content
- **Enhance** — Improves text quality
- **Event Desc** — Writes an event description

### Custom Prompts
Type any question or instruction in the chat input. Examples:
- "Write a formal introduction for this week's newsletter about AI ethics"
- "Translate this event description to German"
- "Make this text shorter and more engaging"
- "Generate a call-to-action for the upcoming workshop"

### Tips for Good Results
1. **Be specific**: "Write a 3-sentence intro about our AI ethics lecture series" works better than "Write something"
2. **Provide context**: The AI knows it's writing for RAIS² newsletters, but adding details helps
3. **Iterate**: If the first result isn't perfect, ask the AI to adjust: "Make it shorter" or "Use a more formal tone"
4. **Use the regenerate button**: Click the regenerate icon on any AI message to get an alternative version

## Testing Your Setup

1. Go to **Settings** → **AI Assistant**
2. Click **Test AI Connection**
3. You should see a success message with the model name
4. Open the AI chat on any page and try a quick action

## Changing Providers

You can switch between providers at any time:
1. Go to **Settings** → **AI Assistant**
2. Select a different provider
3. Enter the API key if needed
4. The change takes effect immediately
