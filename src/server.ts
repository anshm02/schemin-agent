import express, { Request, Response } from 'express';
import cookieSession from 'cookie-session';
import cors from 'cors';
import { google } from 'googleapis';
import { googleAuthService } from './services/googleAuth';
import { tokenStorage } from './services/tokenStorage';
import { gptService } from './services/gptService';
import { googleDriveService } from './services/googleDrive';
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

    const auth = await googleAuthService.getAuthenticatedClient(req.session.userId);
    const targetFile = automation.storeTo;
    
    // Analyze the target file format
    const formatAnalysis = await googleDriveService.analyzeFileFormat(auth, targetFile);
    
    if (formatAnalysis.fileType === 'sheet' && formatAnalysis.sheetFormat) {
      // Log to Google Sheet
      const drive = google.drive({ version: 'v3', auth });
      const searchResponse = await drive.files.list({
        q: `name = '${targetFile.replace(/'/g, "\\'")}' and trashed = false`,
        pageSize: 1,
        fields: 'files(id)'
      });
      
      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        const fileId = searchResponse.data.files[0].id!;
        
        // Prepare data for sheet based on columns
        const sheetData = await prepareSheetData(data, formatAnalysis.sheetFormat);
        
        await googleDriveService.appendToSheet(auth, fileId, sheetData);
        
        res.json({ 
          success: true,
          fileType: 'sheet',
          message: `Data logged to ${targetFile}`,
          data: sheetData
        });
      } else {
        res.status(404).json({ error: 'Sheet not found. Please create it first.' });
      }
    } else {
      // Log to document (plain text format)
      const formattedEntry = formatDataForDoc(automation, data, url, timestamp);
      
      const drive = google.drive({ version: 'v3', auth });
      const searchResponse = await drive.files.list({
        q: `name = '${targetFile.replace(/'/g, "\\'")}' and trashed = false`,
        pageSize: 1,
        fields: 'files(id)'
      });
      
      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        const fileId = searchResponse.data.files[0].id!;
        await googleDriveService.appendToDoc(auth, fileId, formattedEntry);
        
        res.json({ 
          success: true,
          fileType: 'doc',
          message: `Data logged to ${targetFile}`
        });
      } else {
        // Create new file if it doesn't exist
        const result = await googleDriveService.appendToFile(auth, targetFile, formattedEntry);
        res.json({ 
          success: true,
          fileType: 'text',
          message: `Data logged to new file ${targetFile}`,
          file: result
        });
      }
    }
  } catch (error) {
    console.error('Automation logging error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

async function prepareSheetData(data: any, sheetFormat: any): Promise<string[]> {
  const headers = sheetFormat.columns || [];
  
  console.log('Preparing sheet data:');
  console.log('  Headers:', headers);
  console.log('  Data:', data);
  
  if (headers.length === 0) {
    console.log('  No headers found - creating data row from extracted fields');
    
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data).map(v => String(v || 'Not detected'));
    
    console.log('  Auto-generated headers:', dataKeys);
    console.log('  Data values:', dataValues);
    console.log('  Final row:', dataValues);
    
    return dataValues;
  }
  
  const mappedRow = await phi3Service.mapToSheetHeaders(data, headers);
  
  console.log('  Final row:', mappedRow);
  
  return mappedRow;
}

function formatDataForDoc(automation: any, data: any, url: string, timestamp: string): string {
  let formatted = `
========================================
Automation: ${automation.title}
Date: ${timestamp}
URL: ${url}
----------------------------------------
`;
  
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'extractedAt' && key !== 'pageUrl' && key !== 'pageTitle') {
      formatted += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
    }
  }
  
  formatted += `========================================\n\n`;
  
  return formatted;
}

app.post('/api/summarize-article', async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, url, content, targetFile, scrollPercentage } = req.body;
    
    if (!title || !content || !targetFile) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const auth = await googleAuthService.getAuthenticatedClient(req.session.userId);
    
    const formatAnalysis = await googleDriveService.analyzeFileFormat(auth, targetFile);
    
    if (formatAnalysis.fileType === 'sheet' && formatAnalysis.sheetFormat) {
      const sheetFormat = formatAnalysis.sheetFormat;
      
      const extractedData = await gptService.extractForSheet(
        title,
        url,
        content,
        scrollPercentage || 100,
        sheetFormat
      );
      
      const drive = google.drive({ version: 'v3', auth });
      const searchResponse = await drive.files.list({
        q: `name = '${targetFile.replace(/'/g, "\\'")}' and trashed = false`,
        pageSize: 1,
        fields: 'files(id)'
      });
      
      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        const fileId = searchResponse.data.files[0].id!;
        await googleDriveService.appendToSheet(auth, fileId, extractedData);
        
        res.json({ 
          success: true,
          fileType: 'sheet',
          extractedData,
          message: 'Data added to sheet'
        });
      } else {
        res.status(404).json({ error: 'Sheet not found' });
      }
    } else if (formatAnalysis.fileType === 'doc' && formatAnalysis.docFormat) {
      const docFormat = formatAnalysis.docFormat;
      
      let summary: string;
      if (formatAnalysis.isEmpty) {
        const summaryPrompt = `Please provide a concise summary of the following article content. The user has read ${Math.round(scrollPercentage || 100)}% of this article.

Title: ${title}
URL: ${url}

Content:
${content}

Provide a clear, structured summary that captures the key points and main ideas.`;

        summary = await gptService.summarizeArticle(req.session.userId, summaryPrompt);
        
        const timestamp = new Date().toISOString();
        summary = `========================================
Date: ${timestamp}
Title: ${title}
URL: ${url}
Read: ${Math.round(scrollPercentage || 100)}%

Summary:
${summary}
========================================`;
      } else {
        summary = await gptService.summarizeForDoc(
          title,
          url,
          content,
          scrollPercentage || 100,
          docFormat
        );
      }
      
      const drive = google.drive({ version: 'v3', auth });
      const searchResponse = await drive.files.list({
        q: `name = '${targetFile.replace(/'/g, "\\'")}' and trashed = false`,
        pageSize: 1,
        fields: 'files(id)'
      });
      
      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        const fileId = searchResponse.data.files[0].id!;
        await googleDriveService.appendToDoc(auth, fileId, summary);
        
        res.json({ 
          success: true,
          fileType: 'doc',
          summary,
          message: 'Summary added to document'
        });
      } else {
        res.status(404).json({ error: 'Document not found' });
      }
    } else {
      const summaryPrompt = `Please provide a concise summary of the following article content. The user has read ${Math.round(scrollPercentage || 100)}% of this article.

Title: ${title}
URL: ${url}

Content:
${content}

Provide a clear, structured summary that captures the key points and main ideas.`;

      const summary = await gptService.summarizeArticle(req.session.userId, summaryPrompt);
      
      const timestamp = new Date().toISOString();
      const formattedEntry = `
========================================
Date: ${timestamp}
Title: ${title}
URL: ${url}
Read: ${Math.round(scrollPercentage || 100)}%

Summary:
${summary}
========================================
`;

      const result = await googleDriveService.appendToFile(auth, targetFile, formattedEntry);
      
      res.json({ 
        success: true,
        fileType: 'text',
        summary,
        file: result
      });
    }
  } catch (error) {
    console.error('Article summarization error:', error);
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
    
    console.log('✓ Content is RELEVANT - proceeding with field extraction');
    
    const extractedFields = await phi3Service.extractFields(
      textContent,
      automation.extract
    );
    
    console.log('✓ EXTRACTION COMPLETE');
    
    if (!req.session?.userId) {
      console.log('⚠️  User not authenticated - skipping Google Drive write');
      console.log('========================================\n');
      return res.json({
        relevant: true,
        extractedFields,
        url: content.url,
        title: content.title,
        timestamp: content.timestamp || new Date().toISOString(),
        stored: false,
        message: 'Data extracted but not stored. Please authenticate with Google Drive.'
      });
    }
    
    const auth = await googleAuthService.getAuthenticatedClient(req.session.userId);
    const targetFile = automation.storeTo;
    const timestamp = content.timestamp || new Date().toISOString();
    
    console.log('✓ Writing to Google Drive:', targetFile);
    
    const formatAnalysis = await googleDriveService.analyzeFileFormat(auth, targetFile);
    
    if (formatAnalysis.fileType === 'sheet' && formatAnalysis.sheetFormat) {
      const drive = google.drive({ version: 'v3', auth });
      const searchResponse = await drive.files.list({
        q: `name = '${targetFile.replace(/'/g, "\\'")}' and trashed = false`,
        pageSize: 1,
        fields: 'files(id)'
      });
      
      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        const fileId = searchResponse.data.files[0].id!;
        
        const dataForSheet = {
          ...extractedFields,
          url: content.url,
          timestamp: timestamp
        };
        
        const sheetData = await prepareSheetData(dataForSheet, formatAnalysis.sheetFormat);
        await googleDriveService.appendToSheet(auth, fileId, sheetData);
        
        console.log('✓ Data written to Google Sheet');
        console.log('========================================\n');
        
        res.json({
          relevant: true,
          extractedFields,
          url: content.url,
          title: content.title,
          timestamp: timestamp,
          stored: true,
          storageType: 'sheet',
          storageLocation: targetFile
        });
      } else {
        console.log('❌ Sheet not found:', targetFile);
        console.log('========================================\n');
        return res.status(404).json({ error: 'Sheet not found. Please create it first.' });
      }
    } else {
      const formattedEntry = formatDataForDoc(automation, extractedFields, content.url, timestamp);
      
      const drive = google.drive({ version: 'v3', auth });
      const searchResponse = await drive.files.list({
        q: `name = '${targetFile.replace(/'/g, "\\'")}' and trashed = false`,
        pageSize: 1,
        fields: 'files(id)'
      });
      
      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        const fileId = searchResponse.data.files[0].id!;
        await googleDriveService.appendToDoc(auth, fileId, formattedEntry);
        
        console.log('✓ Data written to Google Doc');
        console.log('========================================\n');
        
        res.json({
          relevant: true,
          extractedFields,
          url: content.url,
          title: content.title,
          timestamp: timestamp,
          stored: true,
          storageType: 'doc',
          storageLocation: targetFile
        });
      } else {
        const result = await googleDriveService.appendToFile(auth, targetFile, formattedEntry);
        
        console.log('✓ Data written to new file:', targetFile);
        console.log('========================================\n');
        
        res.json({
          relevant: true,
          extractedFields,
          url: content.url,
          title: content.title,
          timestamp: timestamp,
          stored: true,
          storageType: 'text',
          storageLocation: targetFile,
          fileId: result.id
        });
      }
    }
    
  } catch (error) {
    console.error('Content processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export default app;

