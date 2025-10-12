# Setup Guide

Complete setup instructions for the Schemin Automation System.

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- Google Cloud Platform account
- OpenAI API account
- Chrome browser

## Google Cloud Setup

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Drive API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
7. Download credentials JSON

### 2. Configure Environment

Create `tokens.json` in the project root:

```json
{
  "client_id": "your-client-id.apps.googleusercontent.com",
  "client_secret": "your-client-secret",
  "redirect_uri": "http://localhost:3000/auth/google/callback"
}
```

Or use environment variables:
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
SESSION_SECRET=your-random-session-secret
```

## OpenAI API Setup

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

Create `webapp/.env`:
```
VITE_OPENAI_API_KEY=sk-your-openai-api-key
```

## Installation

### Backend Server

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server (port 3000)
npm start
```

### Web Dashboard

```bash
# Navigate to webapp directory
cd webapp

# Install dependencies
npm install

# Create .env file with OpenAI key
echo "VITE_OPENAI_API_KEY=sk-your-key" > .env

# Start development server (port 5173)
npm run dev
```

### Chrome Extension

1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `chrome-extension` directory

## Verification

### Check Backend
```bash
curl http://localhost:3000/api/status
# Should return: {"authenticated":false}
```

### Check Web Dashboard
Open `http://localhost:5173` in browser
- Should see automation dashboard

### Check Extension
Click extension icon in Chrome
- Should see "No Active Automations" message initially

## Authentication

1. Open backend server at `http://localhost:3000`
2. Click "Sign in with Google"
3. Grant permissions to access Google Drive
4. You should be redirected back authenticated

## Troubleshooting

### Port Already in Use
```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Backend Won't Start
- Check `tokens.json` exists and is valid
- Verify Google OAuth credentials are correct
- Check logs: `tail -f backend.log`

### Webapp Won't Start
- Verify OpenAI API key in `.env`
- Check node_modules installed: `npm install`
- Check logs: `tail -f webapp.log`

### Extension Not Loading
- Verify manifest.json has no errors
- Check extension console for errors
- Reload extension from `chrome://extensions/`

## Next Steps

After setup is complete, see `TESTING.md` for usage instructions.
