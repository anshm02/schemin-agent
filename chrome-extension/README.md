# Chrome Extension

Browser extension for capturing data from websites based on user-defined automations.

## Features

- Dynamic permission system (only requested domains)
- Smart data extraction from any website
- User-controlled logging (button click required)
- Badge notification for applicable automations
- Privacy-first design

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this directory (`chrome-extension`)

## Usage

### Creating Automations

Automations are created in the web dashboard at `http://localhost:5173`

Example:
```
Track job postings from LinkedIn and Indeed,
extract job title, company, location, and salary,
save to job_applications sheet
```

### Capturing Data

1. Visit a website matching your automation sources
2. Extension badge shows blue dot when applicable
3. Click extension icon to open popup
4. Review automation details
5. Click "Grant Permissions" if prompted
6. Click "Log to [sheet name]" to capture data

### Permissions

The extension uses optional permissions:
- Only requests access to websites you configure
- Permission prompt on first use of each automation
- Can revoke permissions anytime in `chrome://extensions/`

## Architecture

### Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup UI
- `popup.js` - Popup logic and automation matching
- `content.js` - Data extraction from web pages
- `background.js` - Badge management and page monitoring

### Data Flow

```
User visits website
    ↓
Background script checks for matching automations
    ↓
Badge shows blue dot if match found
    ↓
User clicks extension icon
    ↓
Popup fetches automations from backend
    ↓
User clicks "Log" button
    ↓
Content script extracts data from page
    ↓
Data sent to backend API
    ↓
Backend logs to Google Sheets
```

## Data Extraction

The content script intelligently extracts data based on automation fields:

### Job Sites
- Job Title: H1 tags, job-title classes, data attributes
- Company: Company name links, employer divs
- Location: Location spans, geographic patterns
- Salary: Currency patterns, compensation text

### Article Sites
- Title: H1, article title, meta tags
- Author: Author links, bylines, meta tags
- Date: Time elements, datetime attributes
- Content: Article tags, main content

### Custom Extraction
Works across most websites using:
- Semantic HTML selectors
- Data attributes
- Meta tags
- Text pattern matching

## Privacy

### What We Access
- Only pages matching your automation sources
- Only when you click the log button
- Only the fields specified in your automation

### What We Don't Do
- No automatic background tracking
- No access to all websites
- No data collection without user action
- No data sent to third parties

## Troubleshooting

### Extension Not Showing Automations

1. Verify backend server is running at `http://localhost:3000`
2. Check automation created in web dashboard
3. Reload extension from `chrome://extensions/`
4. Check extension console for errors

### Permission Denied

1. Click "Grant Permissions" when prompted
2. Accept Chrome permission dialog
3. Verify in `chrome://extensions/` under extension details

### Data Not Extracting

1. Wait for page to fully load
2. Check Extract fields match page content
3. Some sites may block scraping
4. Check browser console for errors

### Can't Connect to Server

1. Verify backend server is running
2. Check `http://localhost:3000/api/automations` returns JSON
3. Ensure no firewall blocking localhost connections

## Development

### Testing Locally

```bash
# Load extension
chrome://extensions/ → Load unpacked → select directory

# Make changes to code
# Click Reload in chrome://extensions/

# Test on website
```

### Debugging

```bash
# Popup console
Right-click extension icon → Inspect popup → Console

# Background console
chrome://extensions/ → Service worker link → Console

# Content script console
F12 on any webpage → Console
```

## Manifest V3 Compliance

This extension follows Manifest V3 requirements:
- Service worker instead of background page
- Optional host permissions (no `<all_urls>`)
- User-initiated actions only
- No remote code execution
