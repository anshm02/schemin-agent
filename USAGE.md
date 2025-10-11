# Usage Guide

## Getting Started

### 1. Set Up Environment Variables

Copy the `env.template` file to `.env` and fill in your credentials:

```bash
cp env.template .env
```

Required credentials:
- **GOOGLE_CLIENT_ID** & **GOOGLE_CLIENT_SECRET**: From Google Cloud Console
- **OPENAI_API_KEY**: From OpenAI Platform
- **SESSION_SECRET**: Generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 2. Start the Application

```bash
npm run dev
```

### 3. Authenticate

1. Open `http://localhost:3000` in your browser
2. Click "Sign in with Google"
3. Authorize the application to access your Google Drive
4. You'll be redirected back to the main interface

## Using the Chat Interface

Once authenticated, you can interact with your Google Drive files using natural language. Here are some examples:

### Search for Files

```
"Find all PDF files in my drive"
"Search for files with 'budget' in the name"
"Show me recently modified files"
```

### Read File Content

```
"Read the content of the file named 'meeting-notes.txt'"
"What's in my TODO.md file?"
"Show me the content of file ID: 1abc..."
```

### Edit Files

```
"Edit my shopping-list.txt and add milk, eggs, and bread"
"Update the budget.txt file with this month's expenses"
"Change the content of file ID 1abc... to [new content]"
```

### Create Files

```
"Create a new text file called 'ideas.txt' with these notes..."
"Make a new document named 'project-plan.txt' with the following outline..."
```

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google"
2. Application redirects to Google OAuth consent screen
3. User authorizes access to Google Drive
4. Google redirects back with authorization code
5. Application exchanges code for access + refresh tokens
6. Tokens are securely stored in `tokens.json`
7. Access tokens are automatically refreshed when expired

### AI-Powered File Operations

1. User sends a natural language query
2. GPT-4 interprets the query and determines which tool to use
3. Application calls appropriate Google Drive API
4. Results are returned to GPT-4
5. GPT-4 formats a human-friendly response
6. Response is displayed to the user

### MCP Protocol

The application implements the Model Context Protocol (MCP) which provides:

- **search_drive_files**: Search for files by name or content
- **read_drive_file**: Read file contents
- **edit_drive_file**: Update existing file content
- **create_drive_file**: Create new files

## API Endpoints

### Web Interface
- `GET /` - Main interface (requires authentication)
- `GET /auth/google` - Initiates OAuth flow
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/logout` - Logout and clear session

### API
- `POST /api/chat` - Send message to AI (requires authentication)
  - Body: `{ "message": "your query here" }`
  - Response: `{ "response": "AI response" }`
- `GET /api/status` - Check authentication status
  - Response: `{ "authenticated": true/false, "userId": "..." }`

## Security Features

- **OAuth 2.0**: Industry-standard authentication
- **Token Refresh**: Automatic refresh of expired access tokens
- **Session Management**: Secure cookie-based sessions
- **HTTPS Ready**: Production-ready for HTTPS deployment
- **Secure Storage**: Tokens stored securely in encrypted file

## Production Deployment

For production deployment:

1. Set up HTTPS (required for OAuth)
2. Update `GOOGLE_REDIRECT_URI` to your production URL
3. Set `NODE_ENV=production`
4. Use strong `SESSION_SECRET`
5. Configure Google OAuth for production domain
6. Consider using a database for token storage instead of file

## Troubleshooting

### "Not authenticated" Error
- Clear your browser cookies
- Re-authenticate through the login flow

### "Invalid credentials" Error
- Check your `.env` file has correct credentials
- Ensure Google Drive API is enabled in Google Cloud Console

### Token Expired
- Tokens are automatically refreshed
- If issues persist, logout and re-authenticate

### Rate Limits
- Google Drive API has rate limits
- OpenAI API has rate limits based on your plan
- Consider implementing caching for frequently accessed files

