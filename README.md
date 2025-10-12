# Schemin Automation System

A smart automation system for tracking web content and logging data to Google Drive. Create automations using natural language, then capture data from any website with a single click.

## Overview

The system consists of three components:

1. **Backend Server** - Node.js API server handling Google Drive integration and data processing
2. **Web Dashboard** - React application for creating and managing automations
3. **Chrome Extension** - Browser extension for capturing data from websites

## Key Features

- Natural language automation creation using GPT-4
- Privacy-first design with dynamic permissions
- User-controlled data logging (no automatic tracking)
- Smart data extraction from any website
- Google Sheets and Google Docs integration

## Quick Start

### Prerequisites

- Node.js 16+
- Google Cloud OAuth credentials
- OpenAI API key
- Chrome browser

### Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Set up environment variables
# Add Google OAuth credentials and OpenAI API key to .env or tokens.json
```

### Running the Application

Start both services in separate terminals:

```bash
# Terminal 1: Backend Server (port 3000)
npm start

# Terminal 2: Web Dashboard (port 5173)
cd webapp
npm install
echo "VITE_OPENAI_API_KEY=your-key-here" > .env
npm run dev
```

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` directory

## Usage

### Creating an Automation

1. Open the web dashboard at `http://localhost:5173`
2. Type your automation in plain English:
   ```
   Track job postings from LinkedIn and Indeed,
   extract job title, company, location, and salary,
   save to job_applications sheet
   ```
3. Press Enter to create the automation card

### Using the Extension

1. Visit a matching website (e.g., LinkedIn)
2. Click the extension icon (badge shows a blue dot when applicable)
3. Grant permissions if prompted
4. Click "Log to [sheet name]" to capture data
5. Data is automatically saved to your Google Sheet

## Architecture

```
Web Dashboard (React)
    ↓ HTTP POST
Backend Server (Node.js)
    ↓ Stores in memory
Chrome Extension
    ↓ HTTP GET
    ↓ Captures data
Backend Server
    ↓ Formats and saves
Google Drive (Sheets/Docs)
```

## Privacy & Permissions

- No `<all_urls>` permission required
- Only requests access to websites you explicitly configure
- Data is logged only when you click the button
- All permissions are optional and can be revoked

## Documentation

- `SETUP.md` - Detailed installation and configuration instructions
- `TESTING.md` - Testing guide and troubleshooting
- `chrome-extension/README.md` - Extension-specific documentation
- `webapp/README.md` - Web dashboard documentation

## License

See LICENSE file for details.
