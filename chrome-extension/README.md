# Article Summarizer Chrome Extension

This Chrome extension automatically detects when you're reading articles, tracks your reading progress, and summarizes what you've read using GPT-4 Turbo. Summaries are automatically saved to your Google Drive.

## Features

- **Automatic Article Detection**: Detects when you're reading an article on any website
- **Reading Progress Tracking**: Monitors how much of the article you've read based on scroll position
- **Auto-Summarization**: Automatically summarizes content when you switch tabs
- **Manual Summarization**: Button to manually trigger summarization
- **Google Drive Integration**: Saves all summaries to a file you specify in your Google Drive

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from this project

## Setup

1. Make sure your backend server is running at `http://localhost:3000` (or configure a custom URL)
2. Log in to your Google account through the web interface at `http://localhost:3000`
3. Click the extension icon in Chrome
4. Configure settings:
   - **Server URL**: Your backend server URL (default: http://localhost:3000)
   - **Target Google Drive File**: Name of the file where summaries will be saved (e.g., "article-summaries.txt")
   - **Auto-summarize on tab switch**: Toggle to enable/disable automatic summarization
5. Click "Save Settings"

## Usage

### Automatic Mode
1. Enable "Auto-summarize on tab switch" in extension settings
2. Visit any article page
3. Read the article (scroll through it)
4. Switch to a different tab
5. The extension will automatically send your reading progress to GPT-4 for summarization
6. Summary is appended to your specified Google Drive file

### Manual Mode
1. Visit any article page
2. Read the article
3. Click the extension icon
4. Click "Summarize Current Article" button
5. Summary is saved to your Google Drive file

## How It Works

1. **Content Script** (`content.js`): Runs on all web pages, detects articles, and tracks scroll position
2. **Background Worker** (`background.js`): Monitors tab switches and triggers summarization
3. **Popup UI** (`popup.html/js`): Configuration interface
4. **Backend API** (`/api/summarize-article`): Processes article content with GPT-4 and saves to Drive

## Summary Format

Each summary in your Google Drive file includes:
- Date and time
- Article title
- Article URL
- Reading progress percentage
- GPT-4 generated summary

## Supported Sites

The extension works on any website with articles, including:
- News sites (CNN, BBC, NYTimes, etc.)
- Blogs
- Medium articles
- Wikipedia
- Documentation sites
- Any page with article-like content

## Permissions

- **tabs**: Monitor tab switches
- **storage**: Save extension settings
- **activeTab**: Access current tab content
- **host_permissions**: Communicate with your backend server

## Troubleshooting

**Extension doesn't detect articles:**
- Make sure you're on a page with substantial article content
- Check the extension popup to see if an article is detected

**Summaries not saving:**
- Verify you're logged in at `http://localhost:3000`
- Check that the target file name is set correctly
- Ensure your backend server is running
- Check browser console for errors

**Authentication errors:**
- Log out and log back in through the web interface
- Make sure your Google Drive API credentials are valid

## Configuration Files

- `manifest.json`: Extension configuration and permissions
- `content.js`: Article detection and tracking
- `background.js`: Tab monitoring and API communication
- `popup.html/js`: Settings interface
- `icon*.png`: Extension icons

