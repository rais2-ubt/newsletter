# RAIS² Newsletter Manager — User Guide

A complete guide to using every feature of the RAIS² Newsletter Manager.

---

## Table of Contents

- [Overview](#overview)
  - [Navigation](#navigation)
  - [How Data Flows](#how-data-flows)
- [Dashboard](#dashboard)
  - [What You See](#what-you-see)
  - [Scraping Content](#scraping-content)
  - [Quick Actions](#quick-actions)
- [CSV Processor](#csv-processor)
  - [Uploading a CSV File](#uploading-a-csv-file)
  - [The Field Inspector](#the-field-inspector)
  - [Content Types](#content-types)
  - [Generating Text](#generating-text)
  - [Language Toggle](#language-toggle)
  - [Saving Items](#saving-items)
- [Newsletter Builder](#newsletter-builder)
  - [Browsing Content](#browsing-content)
  - [Selecting Items](#selecting-items)
  - [Drag-and-Drop](#drag-and-drop)
  - [Newsletter Settings](#newsletter-settings)
  - [Live Preview](#live-preview)
  - [Saving Your Newsletter](#saving-your-newsletter)
  - [Publication Filters](#publication-filters)
- [CMS Export](#cms-export)
  - [Data Sources](#data-sources)
  - [Generating CMS Fields](#generating-cms-fields)
  - [Using the Generated Fields](#using-the-generated-fields)
- [Archive](#archive)
  - [Viewing Newsletters](#viewing-newsletters)
  - [Newsletter Status](#newsletter-status)
  - [Actions](#actions)
- [Subscribers](#subscribers)
  - [Managing Your Email List](#managing-your-email-list)
  - [Adding Subscribers](#adding-subscribers)
  - [Google Sheets Sync](#google-sheets-sync)
  - [Removing Subscribers](#removing-subscribers)
- [Settings](#settings)
  - [Email Configuration](#email-configuration)
  - [AI Assistant](#ai-assistant)
  - [Data Management](#data-management)
- [Tips & Tricks](#tips--tricks)
  - [Service Worker / Cache Issues](#service-worker--cache-issues)
  - [Regular Backups](#regular-backups)
  - [AI Chat Panel](#ai-chat-panel)
  - [Keyboard Tips](#keyboard-tips)

---

## Overview

The RAIS² Newsletter Manager is a browser-based tool for creating, managing, and distributing newsletters for the University of Bayreuth's RAIS² Center for Responsible AI. It runs entirely in your browser — no installation required. All data is stored locally in your browser's storage.

To start the application, run the following command in a terminal from the project folder:

```
python3 -m http.server 8080
```

Then open your browser and go to `http://localhost:8080`.

### Navigation

The sidebar on the left provides access to all pages:

- **Dashboard** — Your starting point. See stats, scrape content, and get an overview of your data.
- **Create Newsletter** — The newsletter builder. Assemble content into a formatted newsletter.
- **CSV Processor** — Import data from spreadsheets (e.g., Google Forms, Excel exports).
- **CMS Export** — Export content for the University of Bayreuth CMS (Akkordeonelement format).
- **Archive** — View, preview, and manage saved newsletters.
- **Subscribers** — Manage your email recipient list.
- **Settings** — Configure email delivery, AI providers, and manage your data.

### How Data Flows

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
  │  (UBT CMS)  │  │  (via Gmail) │
  └──────────────┘  └──────────────┘
```

Your content enters the system in three ways:

1. **Scraping** — Automatically fetches content from the RAIS² website.
2. **CSV Upload** — Import data from spreadsheets, Google Forms responses, or other tabular data.
3. **Manual Entry** — Type in content directly using a form.

Once content is in the system, you assemble it in the **Newsletter Builder**, then either export it for the university CMS or send it as an email to your subscribers.

---

## Dashboard

The Dashboard is your home screen. It gives you a quick overview of everything in the system and is the starting point for scraping new content from the RAIS² website.

### What You See

- **Stats cards** at the top showing counts for:
  - New items available
  - Subscribers in your list
  - Saved newsletters in the archive
  - CSV items you have imported
- **Scraping Dashboard** — Controls and status for fetching content from the RAIS² website.
- **Recent Content** — A preview of the latest items that have been scraped or imported.

### Scraping Content

Scraping pulls content from the RAIS² website and stores it locally so you can use it in your newsletters.

1. Click **Scrape Now** on the Dashboard.
2. The system fetches content from the RAIS² website across 6 categories:
   - News
   - Events
   - Lectures
   - Publications
   - Members
   - Projects
3. A progress bar shows the status for each category as it is fetched.
4. Scraped content is cached locally for 24 hours to avoid unnecessary requests.
5. Use **Clear Cache** to remove cached data and force a fresh scrape next time.

> **Note:** Scraping uses CORS proxies to access the RAIS² website from your browser. The system automatically checks proxy health and selects the fastest working proxy. If scraping fails, try again — a different proxy will be tried.

### Quick Actions

Below the stats cards, you will find quick action buttons:

- **Create Newsletter** — Opens the Newsletter Builder directly.
- **View Archive** — Opens the Archive page to see saved newsletters.
- **Clear Cache** — Removes all cached scraping data so the next scrape fetches fresh content.

---

## CSV Processor

The CSV Processor lets you import data from spreadsheets (e.g., Google Forms responses, Excel exports, conference lists) and convert them into newsletter-ready content with formatted text.

### Uploading a CSV File

1. Go to **CSV Processor** in the sidebar.
2. Upload your file by either:
   - **Dragging and dropping** the file onto the upload area, or
   - **Clicking** the upload area and selecting a file from your computer.
3. The system parses the CSV file and displays all found items as a list.

Supported formats: `.csv` files with comma, semicolon, or tab delimiters. The parser handles quoted fields and multi-line values automatically.

### The Field Inspector

After uploading, click on any item to open the **Field Inspector** panel. This shows you:

- All detected fields from the CSV (title, date, speaker, location, etc.).
- How each field was mapped from your CSV column names to the internal schema.
- Which fields are marked as **required** vs. **optional** for the detected content type.
- The raw CSV data alongside the mapped values, so you can verify correctness.

> **Tip:** The system recognizes many column name variations. For example, a "Speaker" column could also be named "Referent", "Presenter", "Lecturer", "Vortragende/r", or similar. You do not need to rename your CSV columns to match a specific format.

### Content Types

The system detects the type of each item and applies a matching deterministic template. There are 6 templates:

1. **Lecture/Talk** — Focused on the speaker. Includes speaker name, title, biography, and abstract. Best for regular lecture series entries.
2. **Workshop** — Facilitator-led content with a hands-on focus. Emphasizes practical aspects and participation details.
3. **Conference** — For multi-day, larger-scale events. Highlights dates, venue, keynote speakers, and registration.
4. **Call for Papers (CFP)** — Submission-focused. Highlights deadlines, topics, submission requirements, and contact information.
5. **Event** — General events with logistical details (date, time, location, registration).
6. **News** — General announcements and updates. Flexible format for miscellaneous content.

The type is detected automatically based on keywords in the title and description, but you can change it manually if needed.

### Generating Text

For each imported item, the system generates text in three formats:

- **Plain Text** — Clean, unformatted text suitable for simple email newsletters or text-only contexts.
- **HTML** — Fully styled HTML with colors, headings, and formatting that matches the UBT corporate design (green #009260, Crimson Text headings, Source Sans Pro body text).
- **Prompt** — A structured prompt that you can send to an AI assistant to generate customized, polished text. This is useful when you want the AI to write in a specific tone or add creative elements.

Click the format buttons to switch between views. Each format can be copied to the clipboard with a single click.

### Language Toggle

At the top of the text generation area, you will find a **DE / EN** toggle:

- **DE** — Generates text in German.
- **EN** — Generates text in English.

The toggle applies to all three formats (Plain, HTML, Prompt). Switching languages regenerates the text using the same underlying data but with the appropriate language template.

### Saving Items

After reviewing and generating text for your items:

1. Click **Save** (or **Save All**) to store the processed items.
2. Saved items will appear in two places:
   - The **CSV Items** tab in the Newsletter Builder, so you can include them in newsletters.
   - The **CSV Items** source tab in CMS Export, so you can generate CMS fields for them.

Items are stored with all their generated text (both languages, all formats) so you do not need to regenerate them later.

---

## Newsletter Builder

The Newsletter Builder is the heart of the application. This is where you assemble your newsletter by selecting items, organizing them into sections, and previewing the final result.

### Browsing Content

The left panel shows all available content, organized by category tabs:

- **All** — Shows everything from all categories.
- **News** — News items and announcements.
- **Events** — Upcoming events.
- **Lectures** — Talks and lecture series entries.
- **Publications** — Academic publications.
- **Members** — People and team updates.
- **Projects** — Research project updates.
- **CSV Items** — Items you imported via the CSV Processor.

Each item is displayed as a card showing the title, date, and a colored category badge. CSV items are marked with **NEW** and **CSV** badges for easy identification.

### Selecting Items

1. Click on an item card in the left panel to **select** it for the newsletter.
2. The item moves to the **newsletter sections** area on the right side.
3. Items are automatically grouped into sections by their category (e.g., all events go into an "Events" section).
4. Click a selected item again to **deselect** it and remove it from the newsletter.

You can select items from multiple categories to build a newsletter with diverse content.

### Drag-and-Drop

The builder supports drag-and-drop for flexible ordering:

- **Reorder items within a section**: Drag an item card up or down within its section to change its position.
- **Reorder sections**: Drag a section header to change the order of entire sections in the newsletter (e.g., put Events before News).

The order is saved automatically as you drag. The live preview updates instantly to reflect the new arrangement.

### Newsletter Settings

Click the **settings gear icon** to open the newsletter configuration panel:

- **Logo**: Toggle whether to show the RAIS² logo at the top of the newsletter.
- **Divider Style**: Choose the visual separator between sections:
  - Solid line
  - Gradient line
  - Dots
  - Wave pattern
- **Featured Items**: Mark specific items as "featured" to highlight them prominently in the newsletter layout.

### Live Preview

The right panel displays a **live HTML preview** of your newsletter. This preview:

- Updates automatically whenever you add, remove, or reorder items.
- Shows the final HTML rendering with the UBT corporate design (green headings, proper fonts).
- Lets you verify the newsletter looks correct before saving or sending.

You can toggle between the section editor and the full preview using the tabs at the top of the right panel.

### Saving Your Newsletter

1. Click **Save Newsletter** when you are satisfied with the content and layout.
2. Enter a descriptive title for your newsletter (e.g., "RAIS² Newsletter — February 2026").
3. The newsletter is saved to your browser's localStorage.
4. You can find it later in the **Archive** to preview, edit, duplicate, or send it.

### Publication Filters

When viewing the **Publications** tab, additional filter controls appear:

- **Year Filter**: Show publications from a specific year:
  - 2026
  - 2025
  - 2024
  - Earlier
  - All years
- **Sort Options**:
  - Newest First (default)
  - Oldest First
  - Title A-Z

These filters help you quickly find relevant publications when building a newsletter focused on recent research output.

---

## CMS Export

The CMS Export page generates formatted fields for the University of Bayreuth content management system. It produces content in the **Akkordeonelement** (accordion element) format used by the UBT CMS.

### Data Sources

Four tabs provide different ways to get content into the CMS export:

1. **Newsletter Items** — Content that was scraped from the RAIS² website. Select any scraped item to generate CMS fields.
2. **Google Forms** — Import data from Google Forms via three methods:
   - **CSV upload** — Upload a CSV export from Google Forms.
   - **JSON paste** — Paste JSON data directly.
   - **Google Sheets API** — Connect to a Google Sheet for live data.
3. **Manual Entry** — Fill in the CMS fields manually using a structured form. Useful for one-off content that does not come from any other source.
4. **CSV Items** — Items previously imported and saved via the CSV Processor. Their generated text is ready to use.

### Generating CMS Fields

1. Select an item from any of the four source tabs.
2. The right panel generates CMS fields organized into the **Akkordeonelement** field groups:
   - **Allgemein** (General): Internal name, display title, URL path.
   - **Content**: The visible title and HTML body content for the accordion element.
   - **Flipside**: Sorting order, image display settings.
   - **Felder** (Fields): Date fields, distribution channels, metadata.
3. For CSV Items, the generated text section appears below the CMS fields, showing all available text formats (Plain, HTML, Prompt) in both languages.

### Using the Generated Fields

- Click the **Copy** button next to any field to copy its value to the clipboard.
- Open the UBT CMS in another browser tab.
- Navigate to the Akkordeonelement you want to edit.
- Paste each field value into the corresponding CMS input field.
- Repeat for all field groups.

> **Tip:** Work through the field groups top to bottom (Allgemein, Content, Flipside, Felder) to fill out the CMS form systematically.

---

## Archive

The Archive stores all newsletters you have saved from the builder. It serves as your newsletter history and the launch point for sending.

### Viewing Newsletters

- The archive displays all saved newsletters in a **card grid**.
- Each card shows:
  - Newsletter title
  - Creation date
  - Current status (Draft or Sent)
  - Number of sections and items

Click on a card to see more details and access actions.

### Newsletter Status

Each newsletter has one of these statuses:

- **Draft** — The newsletter has been saved but not yet sent to subscribers.
- **Sent** — The newsletter has been emailed to your subscriber list.

The status is displayed as a colored badge on each card.

### Actions

For each newsletter, you can:

- **Preview** — Open a full-screen preview of the newsletter HTML. This shows exactly what recipients will see.
- **Edit** — Return to the Newsletter Builder with the newsletter loaded, so you can make changes.
- **Duplicate** — Create a copy of the newsletter. Useful for creating a new edition based on a previous template.
- **Send** — Send the newsletter to all active subscribers via email. This requires email to be configured in Settings (see [Email Configuration](#email-configuration)).
- **Delete** — Remove the newsletter from the archive.

---

## Subscribers

The Subscribers page manages your email recipient list. Everyone on this list receives newsletters when you click "Send" from the Archive.

### Managing Your Email List

The page shows a table of all subscribers with the following columns:

- **Email** — The subscriber's email address.
- **Name** — The subscriber's display name.
- **Status** — Active, Inactive, or Pending.
- **Actions** — Edit or delete buttons.

Use the **search bar** at the top to filter subscribers by name or email address.

### Adding Subscribers

1. Click the **Add Subscriber** button.
2. Enter the subscriber's email address (required) and name (optional).
3. Click **Save**.
4. New subscribers are set to **Active** status by default.

### Google Sheets Sync

If you have configured email delivery via Google Apps Script (see [Email Configuration](#email-configuration)):

1. Click the **Sync** button on the Subscribers page.
2. The system synchronizes your local subscriber list with the connected Google Sheet.
3. New subscribers found in the Google Sheet are added locally.
4. Local changes are pushed to the Google Sheet.
5. The sync merges both directions, so no data is lost.

This is useful when multiple people manage the subscriber list, or when subscribers sign up via a Google Form that feeds into the same sheet.

### Removing Subscribers

You have two options for removing someone from the list:

- **Delete**: Click the delete icon next to a subscriber to permanently remove them.
- **Deactivate**: Change their status to **Inactive**. They remain in the list but will not receive newsletters. This is useful if someone wants to pause their subscription temporarily.

---

## Settings

The Settings page lets you configure email delivery, AI providers, and manage your application data.

### Email Configuration

The email section shows:

- **Status indicator**: Green checkmark if email is configured, red X if not.
- **Web App URL**: Enter the URL of your Google Apps Script web app that handles email sending.
- **From Name**: The sender name that appears in recipients' inboxes (default: "RAIS2 Newsletter").
- **Reply-To**: The email address where replies should go.
- **Test Connection**: Click to verify that the Apps Script URL is reachable and responding correctly.
- **Send Test Email**: Send a test newsletter to yourself to verify formatting and delivery.

> For detailed steps on setting up Google Apps Script for email delivery, see the [Email Setup Guide](email-setup-en.md).

### AI Assistant

The AI assistant helps you write, summarize, and enhance newsletter content. Configure it here:

- **Provider**: Choose your AI provider:
  - **OpenRouter** — Free tier available, no API key needed for free models.
  - **Puter/Grok** — Free, no API key needed.
  - **OpenAI** — Requires an API key from OpenAI.
  - **Claude** — Requires an API key from Anthropic.
- **API Key**: Enter your API key (required only for OpenAI and Claude).
- **Model**: Select which AI model to use from the chosen provider.
- **System Prompt**: Customize how the AI behaves. The default prompt is tuned for academic newsletter writing at the University of Bayreuth.

> For detailed setup instructions for each provider, see the [AI Setup Guide](ai-setup-en.md).

### Data Management

This section provides tools for backing up and managing your data:

- **Export Data**: Download all your application data (newsletters, items, subscribers, settings) as a single JSON file. **Use this regularly for backups.**
- **Import Data**: Upload a previously exported JSON file to restore your data. This overwrites current data.
- **Clear Cache**: Remove cached scraping data. Does not affect saved newsletters or subscribers.
- **Clear Seen History**: Reset the tracking of which items you have already viewed. Items will appear as "new" again.
- **Storage Size**: Shows how much of your browser's localStorage is currently used by the application.

> **Important:** All your data lives in your browser's localStorage. If you clear your browser data, switch browsers, or use a different computer, your data will not be there. **Export your data regularly** and save the JSON file somewhere safe. You can restore from it at any time using Import Data.

---

## Tips & Tricks

### Service Worker / Cache Issues

The application uses a service worker to cache files for faster loading. Sometimes this means changes do not appear immediately. If the application seems stuck or is not reflecting updates:

1. **Add a cache-busting parameter**: Append `?nocache=1` to the URL in your browser's address bar (e.g., `http://localhost:8080/builder.html?nocache=1`).
2. **Unregister the service worker**: Open your browser's DevTools (press F12), go to the **Application** tab, click **Service Workers** in the left menu, and click **Unregister**.
3. **Clear browser cache**: Press Ctrl+Shift+Delete (Windows/Linux) or Cmd+Shift+Delete (Mac) to open the cache clearing dialog.

### Regular Backups

Since all data is stored in your browser, regular backups are essential:

1. Go to **Settings** in the sidebar.
2. Click **Export Data**.
3. Save the downloaded JSON file to a safe location (e.g., a shared network drive or cloud storage).
4. To restore, go to Settings and click **Import Data**, then select your backup file.

We recommend exporting after every major newsletter you create or send.

### AI Chat Panel

The AI assistant is available on several pages. Look for the **chat icon** in the bottom-right corner of the screen. The AI can help you with:

- **Write Intro** — Generate a newsletter introduction paragraph based on the content you have selected.
- **Summarize** — Condense a long piece of text into a shorter summary.
- **Enhance** — Improve existing text by making it more engaging, fixing grammar, or adjusting tone.
- **Event Description** — Generate a complete event description from basic details (title, date, location).

The AI uses whichever provider and model you have configured in Settings. Free providers (OpenRouter free models, Puter/Grok) work without any API key.

### Keyboard Tips

- Use **Tab** to move between form fields and interactive elements.
- **Ctrl+C** (Windows/Linux) or **Cmd+C** (Mac) to copy selected text.
- **Ctrl+V** (Windows/Linux) or **Cmd+V** (Mac) to paste from clipboard.
- **Escape** to close modals, side panels, and dropdown menus.
- **Enter** to confirm dialogs and submit forms.

---

## Getting Help

If you encounter issues:

1. Check the [Tips & Tricks](#tips--tricks) section above for common solutions.
2. Try clearing the cache and reloading the page.
3. Export your data as a backup before troubleshooting further.
4. Contact the RAIS² technical team for assistance.

---

*RAIS² Newsletter Manager — University of Bayreuth, Center for Responsible AI in Society*
