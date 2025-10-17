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

### System Flow
```
Web Dashboard (React)
    ↓ HTTP POST
Backend Server (Node.js)
    ↓ Stores in memory
Chrome Extension
    ↓ HTTP GET
    ↓ Captures data
Backend Server
    ↓ Phi-3.5 AI Processing
    ↓ MCP Layer (Model Context Protocol)
    ↓ Google Drive Service
    ↓ Formats and saves
Google Drive (Sheets/Docs)
```

### MCP Integration
The system uses **Model Context Protocol (MCP)** as an abstraction layer for all Google Drive operations:

- **MCP Server** (`src/services/mcpServer.ts`) - Provides standardized tools for Drive, Sheets, and Docs
- **Google Drive Service** (`src/services/googleDrive.ts`) - Implements actual Google API calls
- **Benefits:**
  - Clean separation of concerns
  - Self-documenting tool interface
  - Comprehensive logging with emoji indicators
  - Testable and maintainable
  - 35% smaller code (unused protocol code removed)

**Available MCP Tools:**
- `search_drive_files` - Search for files by name
- `get_sheet_format` - Analyze sheet structure and headers
- `append_to_sheet` - Add rows to sheets
- `get_doc_format` - Analyze document style
- `append_to_doc` - Add content to docs
- `analyze_file_format` - Detect file type and format

**MCP Logging:**
All MCP operations are logged with clear indicators:
```
[MCP] 🔧 Calling tool: append_to_sheet
[MCP] 📥 Args: {...}
[MCP] 📝 Appending row to sheet (6 values)
[MCP] ✓ Row appended successfully via MCP
```

For more details, see:
- `MCP_MIGRATION_SUMMARY.md` - Architecture details
- `CLEANUP_SUMMARY.md` - Code cleanup and logging details

## Privacy & Permissions

- No `<all_urls>` permission required
- Only requests access to websites you explicitly configure
- Data is logged only when you click the button
- All permissions are optional and can be revoked

## Documentation

- `SETUP.md` - Detailed installation and configuration instructions
- `TESTING.md` - Testing guide and troubleshooting
- `MCP_MIGRATION_SUMMARY.md` - MCP architecture and migration details
- `MCP_TESTING_GUIDE.md` - Guide for testing MCP operations
- `MCP_ARCHITECTURE.md` - Visual architecture diagrams and data flows
- `CLEANUP_SUMMARY.md` - Code cleanup and MCP logging details
- `MIGRATION_COMPLETE.md` - Complete migration summary and checklist
- `chrome-extension/README.md` - Extension-specific documentation
- `webapp/README.md` - Web dashboard documentation

## License

See LICENSE file for details.
