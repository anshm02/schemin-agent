# Web Dashboard

React-based dashboard for creating and managing automations.

## Overview

The web dashboard provides a visual interface for:
- Creating automations using natural language
- Organizing automations in tabs
- Editing and managing automation cards
- Syncing with Chrome extension via backend API

## Setup

```bash
# Install dependencies
npm install

# Create environment file
echo "VITE_OPENAI_API_KEY=sk-your-key-here" > .env

# Start development server
npm run dev
```

Application runs at: `http://localhost:5173`

## Usage

### Creating Automations

Type your automation request in plain English at the bottom input:

```
Track job applications from LinkedIn and Indeed,
extract job title, company, location, and salary,
store in job_tracker sheet
```

Press Enter or click the blue FAB button.

GPT-4 will parse your request into:
- Title: Short descriptive name
- Sources: Websites to track
- Extract: Data fields to capture
- Store To: Google Sheet/Doc name

### Managing Tabs

- **Create Tab**: Click + icon next to tabs
- **Switch Tab**: Click tab name
- **Rename Tab**: Double-click tab name, edit, press Enter

### Managing Cards

- **Drag**: Click and drag cards to reposition
- **Resize**: Drag card edges or corners
- **Edit**: Double-click card to open edit modal
- **Delete**: Currently not implemented (edit and clear fields)

### Data Persistence

All automations are:
- Saved to browser localStorage
- Synced to backend server via HTTP
- Accessible by Chrome extension

## Architecture

### Components

- `App.tsx` - Main application component
- `types.ts` - TypeScript interfaces
- `utils/gptParser.ts` - GPT-4 integration for parsing

### State Management

Uses React hooks:
- `useState` for local state
- `useEffect` for syncing to backend

### API Integration

```typescript
// Sync automations to backend
POST http://localhost:3000/api/automations/sync
{
  "automations": [...]
}
```

## Features

### Natural Language Processing

Uses GPT-4 to parse automation requests:
- Extracts website domains from natural descriptions
- Identifies data fields to capture
- Determines storage location
- Generates descriptive titles

### UI/UX

- Figma-inspired design
- Drag and drop interface
- Real-time updates
- Persistent storage
- Responsive layout

### Tab Organization

- Multiple tabs for different categories
- Independent automation sets per tab
- Tab renaming and management
- Active tab highlighting

## Development

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Environment Variables

Required in `.env`:
```
VITE_OPENAI_API_KEY=sk-your-openai-api-key
```

## Troubleshooting

### GPT Parsing Not Working

1. Check `.env` file exists
2. Verify OpenAI API key is valid
3. Restart dev server (Vite only reads .env on startup)
4. Check browser console for errors

### Automations Not Syncing

1. Verify backend server running on port 3000
2. Check network tab for failed requests
3. Ensure CORS is properly configured
4. Check browser console for sync errors

### UI Not Loading

1. Clear browser cache
2. Check for JavaScript errors in console
3. Verify all dependencies installed
4. Try hard refresh (Ctrl+Shift+R)

## Technology Stack

- React 18
- TypeScript
- Vite (build tool)
- OpenAI API (GPT-4)
- react-rnd (drag and resize)
- Inline CSS (no Tailwind)
