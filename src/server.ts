import express, { Request, Response } from 'express';
import cookieSession from 'cookie-session';
import cors from 'cors';
import { googleAuthService } from './services/googleAuth';
import { tokenStorage } from './services/tokenStorage';
import { gptService } from './services/gptService';
import { mcpServerService } from './services/mcpServer';
import { phi3Service } from './services/readerService';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
}));

declare module 'express-serve-static-core' {
  interface Request {
    session: {
      userId?: string;
    } | null;
  }
}

app.get('/', (req: Request, res: Response) => {
  if (req.session?.userId) {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Drive AI Assistant</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #4285f4; }
            .chat-container { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-top: 20px; }
            .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
            .user-message { background: #e3f2fd; text-align: right; }
            .assistant-message { background: #f5f5f5; }
            input[type="text"] { width: 70%; padding: 10px; margin-right: 10px; }
            button { padding: 10px 20px; background: #4285f4; color: white; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #3367d6; }
            .logout { background: #ea4335; }
            .logout:hover { background: #d33828; }
          </style>
        </head>
        <body>
          <h1>Google Drive AI Assistant</h1>
          <p>You are logged in as: <strong>${req.session.userId}</strong></p>
          <button class="logout" onclick="logout()">Logout</button>
          
          <div class="chat-container">
            <h2>Chat with your Google Drive</h2>
            <div id="messages"></div>
            <div style="margin-top: 20px;">
              <input type="text" id="messageInput" placeholder="Ask me about your Google Drive files..." onkeypress="if(event.key==='Enter') sendMessage()">
              <button onclick="sendMessage()">Send</button>
            </div>
          </div>

          <script>
            async function sendMessage() {
              const input = document.getElementById('messageInput');
              const message = input.value.trim();
              if (!message) return;

              const messagesDiv = document.getElementById('messages');
              messagesDiv.innerHTML += '<div class="message user-message"><strong>You:</strong> ' + message + '</div>';
              input.value = '';

              try {
                const response = await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message })
                });

                const data = await response.json();
                messagesDiv.innerHTML += '<div class="message assistant-message"><strong>Assistant:</strong> ' + data.response + '</div>';
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
              } catch (error) {
                messagesDiv.innerHTML += '<div class="message assistant-message"><strong>Error:</strong> Failed to get response</div>';
              }
            }

            function logout() {
              window.location.href = '/auth/logout';
            }
          </script>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Drive AI Assistant - Login</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; text-align: center; padding: 20px; }
            h1 { color: #4285f4; }
            .login-container { border: 1px solid #ddd; border-radius: 8px; padding: 40px; margin-top: 20px; }
            button { padding: 15px 30px; background: #4285f4; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
            button:hover { background: #3367d6; }
          </style>
        </head>
        <body>
          <h1>Google Drive AI Assistant</h1>
          <div class="login-container">
            <p>Access your Google Drive files using AI-powered natural language queries.</p>
            <p>Search, read, edit, and create files with simple commands.</p>
            <br>
            <a href="/auth/google"><button>Sign in with Google</button></a>
          </div>
        </body>
      </html>
    `);
  }
});

app.get('/auth/google', (req: Request, res: Response) => {
  const authUrl = googleAuthService.getAuthUrl();
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    
    if (!code) {
      return res.status(400).send('Authorization code not provided');
    }

    const { userId, tokens } = await googleAuthService.handleCallback(code);
    
    if (req.session) {
      req.session.userId = userId;
    }

    res.redirect('/');
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

app.get('/auth/logout', (req: Request, res: Response) => {
  if (req.session) {
    req.session = null;
  }
  res.redirect('/');
});

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await gptService.chat(req.session.userId, message);
    
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.get('/api/status', async (req: Request, res: Response) => {
  if (req.session?.userId) {
    const tokens = await tokenStorage.getTokens(req.session.userId);
    res.json({ 
      authenticated: !!tokens,
      userId: req.session.userId 
    });
  } else {
    res.json({ authenticated: false });
  }
});

let globalAutomations: any[] = [];

app.post('/api/automations/sync', async (req: Request, res: Response) => {
  const { automations } = req.body;
  globalAutomations = automations || [];
  res.json({ success: true });
});

app.get('/api/automations', async (req: Request, res: Response) => {
  res.json({ automations: globalAutomations });
});

app.post('/api/log-automation', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { automation, url, data, timestamp } = req.body;
    
    if (!automation || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const webContent = {
      title: data.pageTitle || 'Extracted Data',
      url: url || data.pageUrl || 'Unknown URL',
      content: JSON.stringify(data, null, 2),
      timestamp: timestamp || new Date().toISOString()
    };

    const result = await gptService.processWebContent(
      req.session.userId,
      webContent,
      automation
    );

    res.json({ 
      success: result.success,
      message: result.message,
      details: result.details
    });
  } catch (error) {
    console.error('Automation logging error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});


app.post('/api/process-content', async (req: Request, res: Response) => {
  try {
    const { content, extractionType, automation } = req.body;
    
    if (!content || !automation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let textContent = '';
    
    if (extractionType === 'viewed') {
      textContent = content.viewedElements
        .map((el: any) => el.text)
        .join('\n\n');
    } else if (extractionType === 'readability') {
      textContent = content.textContent || content.htmlContent;
    }
    
    console.log('\n========================================');
    console.log('PROCESSING CONTENT');
    console.log('========================================');
    console.log('URL:', content.url);
    console.log('Title:', content.title);
    console.log('Extraction Type:', extractionType);
    console.log('Automation:', automation.title);
    console.log('Extracted Content Length:', textContent.length);
    console.log('Extracted Content Preview:');
    console.log(textContent.substring(0, 500));
    console.log('...\n');
    
    const isRelevant = await phi3Service.classifyIntent(
      textContent,
      automation.title,
      automation.extract
    );
    
    if (!isRelevant) {
      console.log('Content deemed NOT RELEVANT by model');
      console.log('========================================\n');
      return res.json({
        relevant: false,
        message: 'Content is not relevant to the automation intent',
        contentPreview: textContent.substring(0, 500)
      });
    }
    
    console.log('✓ Content is RELEVANT - proceeding with LLM processing');
    
    if (!req.session?.userId) {
      console.log('⚠️  User not authenticated - skipping Google Drive write');
      console.log('========================================\n');
      return res.json({
        relevant: true,
        url: content.url,
        title: content.title,
        timestamp: content.timestamp || new Date().toISOString(),
        stored: false,
        message: 'Content is relevant but not stored. Please authenticate with Google Drive.'
      });
    }

    const webContent = {
      title: content.title,
      url: content.url,
      content: textContent,
      timestamp: content.timestamp || new Date().toISOString()
    };

    const result = await gptService.processWebContent(
      req.session.userId,
      webContent,
      automation
    );

    res.json({
      relevant: true,
      stored: result.success,
      message: result.message,
      details: result.details,
      url: content.url,
      title: content.title
    });
    
  } catch (error) {
    console.error('Content processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export default app;

