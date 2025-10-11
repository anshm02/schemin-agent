# Google Drive AI Assistant - Setup Guide

## Prerequisites
- Node.js 18+ installed
- Google Cloud Platform account
- OpenAI API account

## Step 1: Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
   - Download the credentials JSON file

5. Configure OAuth Consent Screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in application name and required fields
   - Add scopes: `https://www.googleapis.com/auth/drive`
   - Add test users if in testing mode

## Step 2: OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys section
3. Create a new API key
4. Save the key securely

## Step 3: Project Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in the project root:
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
OPENAI_API_KEY=your_openai_api_key_here
SESSION_SECRET=generate_a_random_secret_here
PORT=3000
```

3. Generate a session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Run the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Step 5: Using the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Click "Sign in with Google"
3. Authorize the application to access your Google Drive
4. Start chatting with your Google Drive files!

## Example Queries

- "Search for all PDF files in my Drive"
- "Show me files modified in the last week"
- "Read the content of the file named 'meeting-notes.txt'"
- "Create a new text file called 'todo.txt' with a list of my tasks"
- "Edit the file 'budget.txt' and add expenses for this month"

## Security Notes

- Never commit your `.env` file to version control
- Keep your OAuth credentials secure
- Regularly rotate your API keys
- Use HTTPS in production
- The `tokens.json` file contains sensitive user tokens - keep it secure

