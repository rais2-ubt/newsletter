<div align="center">

# RAIS² Newsletter Manager

**Create, manage, and send beautiful newsletters for the RAIS² Center for Responsible AI**

[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![No Dependencies](https://img.shields.io/badge/Zero-Dependencies-success?style=for-the-badge)](#-tech-stack)
[![Python 3](https://img.shields.io/badge/Python_3-Server-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Offline Ready](https://img.shields.io/badge/Offline-Ready-8B5CF6?style=for-the-badge)](#-architecture)
[![License MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#license)

<br>

*A complete newsletter workflow — from content scraping to email delivery — running entirely in your browser.*
*No cloud accounts, no sign-ups, no installation beyond Python.*

<br>

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 📊 Dashboard & Scraping
Scrape content directly from the RAIS² website — news, events, lectures, publications, members, and projects. Live proxy health monitoring with automatic fallback.

</td>
<td width="50%" valign="top">

### 📝 CSV Processor
Import data from Google Forms, Excel, or any CSV. Automatic field detection with smart column name matching. Generate text in Plain, HTML, or AI Prompt format.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🏗️ Newsletter Builder
Drag-and-drop editor with live HTML preview. Organize content into sections by category. Customize divider styles, featured items, and layout. UBT Corporate Design built in.

</td>
<td width="50%" valign="top">

### 📤 CMS Export
Generate ready-to-paste fields for the University of Bayreuth CMS (Akkordeonelement format). Supports four data sources with one-click field copying.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🤖 AI Assistant
Built-in AI for writing intros, summaries, and event descriptions. Free options available (OpenRouter, Puter/Grok) — no API key needed. Also supports OpenAI and Claude.

</td>
<td width="50%" valign="top">

### 📧 Email Sending
Send newsletters via Gmail using Google Apps Script. Automatic unsubscribe links, subscriber tracking, and batch sending with rate limiting.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 👥 Subscriber Management
Manage your mailing list with status tracking (active, inactive, pending). Sync with Google Sheets for centralized subscriber data.

</td>
<td width="50%" valign="top">

### 📂 Newsletter Archive
Browse all saved newsletters in a visual grid. Preview, edit, duplicate, or send any newsletter. Track sent/draft status at a glance.

</td>
</tr>
</table>

---

## 🚀 Quick Start

**1️⃣ &nbsp; Check for Python**

```bash
python3 --version
```

> Don't have Python? Download it free from [python.org](https://www.python.org/downloads/). Mac and Linux usually have it pre-installed.

**2️⃣ &nbsp; Start the server**

```bash
cd path/to/rais2-newsletter-static
python3 -m http.server 8080
```

**3️⃣ &nbsp; Open in your browser**

```
http://localhost:8080
```

**That's it.** You're ready to build newsletters. No npm, no installs, no config files.

> 📘 Need more detailed instructions? See the **[Getting Started Guide](docs/getting-started-en.md)** for step-by-step setup on Windows, Mac, and Linux.

---

## 📋 How It Works

```
  ┌──────────┐     ┌──────────────┐     ┌──────────────┐
  │  Scrape  │     │  CSV Upload  │     │   Manual     │
  │  Website │     │  (Forms etc) │     │   Entry      │
  └────┬─────┘     └──────┬───────┘     └──────┬───────┘
       │                  │                     │
       └──────────┬───────┴─────────────────────┘
                  ▼
       ┌─────────────────────┐
       │  Newsletter Builder  │  ← Select, reorder, customize
       └──────────┬──────────┘
                  │
          ┌───────┴───────┐
          ▼               ▼
  ┌──────────────┐  ┌──────────────┐
  │  CMS Export  │  │  Send Email  │
  │  (UBT CMS)  │  │  (Gmail)     │
  └──────────────┘  └──────────────┘
```

1. **Gather content** — Scrape the RAIS² website, upload CSV data from Google Forms, or add items manually
2. **Build the newsletter** — Drag and drop items into sections, reorder them, and preview the result live
3. **Publish** — Export formatted content to the UBT CMS, or send it as an email via Gmail

---

## 📖 Documentation

<div align="center">

### 🇬🇧 English

[![Getting Started](https://img.shields.io/badge/Getting_Started-Setup_Guide-009260?style=for-the-badge)](docs/getting-started-en.md)
[![User Guide](https://img.shields.io/badge/User_Guide-All_Features-2563EB?style=for-the-badge)](docs/user-guide-en.md)
[![Email Setup](https://img.shields.io/badge/Email_Setup-Gmail_Config-DC2626?style=for-the-badge)](docs/email-setup-en.md)
[![AI Setup](https://img.shields.io/badge/AI_Setup-Providers-8B5CF6?style=for-the-badge)](docs/ai-setup-en.md)

### 🇩🇪 Deutsch

[![Einrichtung](https://img.shields.io/badge/Erste_Schritte-Einrichtung-009260?style=for-the-badge)](docs/getting-started-de.md)
[![Benutzerhandbuch](https://img.shields.io/badge/Benutzer-Handbuch-2563EB?style=for-the-badge)](docs/user-guide-de.md)
[![E-Mail](https://img.shields.io/badge/E--Mail-Einrichtung-DC2626?style=for-the-badge)](docs/email-setup-de.md)
[![KI-Konfiguration](https://img.shields.io/badge/KI-Konfiguration-8B5CF6?style=for-the-badge)](docs/ai-setup-de.md)

</div>

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   RAIS² Newsletter Manager                   │
├───────────┬─────────────┬───────────┬───────────┬───────────┤
│ Dashboard │    CSV      │Newsletter │    CMS    │  Archive  │
│           │  Processor  │  Builder  │   Export  │           │
│ Scrape    │ Upload CSV  │ Drag&Drop │ Generate  │ View &    │
│ content   │ data, map   │ build the │ fields    │ send      │
│ from web  │ fields      │ newsletter│ for CMS   │ saved     │
└─────┬─────┴──────┬──────┴─────┬─────┴─────┬────┴─────┬─────┘
      │            │            │           │          │
      └────────────┴─────┬──────┴───────────┴──────────┘
                         │
                ┌────────┴────────┐
                │  localStorage   │
                │  (your browser) │
                └─────────────────┘
```

All seven pages share data through your browser's **localStorage**. Nothing is sent to an external server unless you explicitly send an email or sync with Google Sheets. Your data stays on your machine.

---

## 🛠️ Tech Stack

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Google Apps Script](https://img.shields.io/badge/Apps_Script-4285F4?style=flat-square&logo=google&logoColor=white)
![Service Worker](https://img.shields.io/badge/Service_Worker-FF6F00?style=flat-square&logo=pwa&logoColor=white)

</div>

---

<details>
<summary><h2>👩‍💻 For Developers</h2></summary>

<br>

| | |
|---|---|
| **Stack** | Vanilla HTML, CSS, JavaScript — no frameworks, no build tools, no npm |
| **Server** | Any static HTTP server (Python, Node, Apache, Nginx, etc.) |
| **Storage** | localStorage for all data, IndexedDB as fallback |
| **Styling** | UBT Corporate Design — Primary: `#009260`, Fonts: Crimson Text + Source Sans Pro |
| **Caching** | Service Worker with aggressive caching. Use `?nocache=1` or unregister SW in DevTools |
| **Modules** | ~20 JS files in `js/`, loaded via `<script>` tags (no bundler) |

### Key Modules

```
js/
├── storage.js          # StorageManager — localStorage CRUD singleton
├── csv-utils.js        # CSV parsing, field extraction, text generation
├── ai-chat.js          # Multi-provider AI (OpenRouter, Puter/Grok, OpenAI, Claude)
├── scraper.js          # Web scraping with CORS proxy support
├── newsletter.js       # Newsletter HTML generation with UBT design
├── drag-drop.js        # Drag-and-drop for the builder
├── cms-generator.js    # Akkordeonelement CMS field generation
├── email.js            # Email sending via Google Apps Script
├── sidebar.js          # Shared sidebar navigation
└── ...                 # ~10 more utility modules
```

### Development Tips

- **Cache busting:** Append `?nocache=1` to any URL, or unregister the service worker in DevTools → Application → Service Workers
- **Data backup:** Settings → Export Data saves a JSON snapshot of all localStorage
- **Hot reload:** The service worker caches aggressively — unregister it during development for instant changes

</details>

---

<div align="center">

**Made with ❤️ at the [University of Bayreuth](https://www.uni-bayreuth.de)**

[RAIS²](https://www.rais2.uni-bayreuth.de) — Center for Responsible AI in Society

</div>
