# Google Drive AI Assistant

A production-level application that integrates Google Drive with GPT through the Model Context Protocol (MCP), enabling natural language interactions with your Google Drive files.

## Features

### Implemented
- 🔐 **Production OAuth 2.0 Flow**: Secure Gmail-based authentication for Google Drive access
- 🔍 **Search Files**: Find files in Google Drive using natural language queries
- 📖 **Read Files**: Read content from any Google Drive file
- ✏️ **Edit Files**: Modify existing files through conversational commands
- 📝 **Create Files**: Generate new files in Google Drive
- 🤖 **GPT Integration**: Powered by OpenAI's GPT-4 Turbo for intelligent file operations
- 🔄 **Token Management**: Automatic token refresh and secure storage

### Technical Architecture
- **Backend**: Node.js + TypeScript + Express
- **Authentication**: Google OAuth 2.0 with automatic token refresh
- **AI Integration**: OpenAI GPT-4 Turbo with function calling
- **MCP Protocol**: Model Context Protocol for AI-to-Drive communication
- **Security**: Session management, secure token storage, HTTPS-ready

## Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
cp env.template .env
# Edit .env with your credentials
```

3. **Run the application**:
```bash
npm run dev
```

4. **Open your browser**: Navigate to `http://localhost:3000`

## Documentation

- **[SETUP.md](./SETUP.md)** - Complete setup instructions for Google Cloud and OpenAI
- **[USAGE.md](./USAGE.md)** - User guide with examples and API reference
- **[env.template](./env.template)** - Environment variables template

## Example Usage

Once authenticated, you can interact with your Google Drive using natural language:

```
User: "Find all my PDF files"
Assistant: [Lists all PDF files with names and links]

User: "Read the content of meeting-notes.txt"
Assistant: [Displays file content]

User: "Create a new file called todo.txt with my tasks for today"
Assistant: [Creates file and confirms]

User: "Edit budget.txt and add this month's expenses"
Assistant: [Updates file and confirms changes]
```
