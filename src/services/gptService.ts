import OpenAI from 'openai';
import { googleAuthService } from './googleAuth';
import { mcpServerService } from './mcpServer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class GPTService {
  private conversationHistory: Map<string, OpenAI.Chat.ChatCompletionMessageParam[]> = new Map();

  async chat(userId: string, userMessage: string): Promise<string> {
    const history = this.conversationHistory.get(userId) || [];
    
    const tools: OpenAI.Chat.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'search_drive_files',
          description: 'Search for files in Google Drive by name or content',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query to find files'
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of results to return (default: 10)'
              }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'read_drive_file',
          description: 'Read the content of a Google Drive file',
          parameters: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'The ID of the file to read'
              }
            },
            required: ['fileId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'edit_drive_file',
          description: 'Edit the content of an existing Google Drive file',
          parameters: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'The ID of the file to edit'
              },
              content: {
                type: 'string',
                description: 'New content for the file'
              },
              mimeType: {
                type: 'string',
                description: 'MIME type of the content (optional)'
              }
            },
            required: ['fileId', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'create_drive_file',
          description: 'Create a new file in Google Drive',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the new file'
              },
              content: {
                type: 'string',
                description: 'Content of the new file'
              },
              mimeType: {
                type: 'string',
                description: 'MIME type of the file (e.g., text/plain, application/json)'
              },
              parentFolderId: {
                type: 'string',
                description: 'Parent folder ID (optional)'
              }
            },
            required: ['name', 'content', 'mimeType']
          }
        }
      }
    ];

    const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
      role: 'system',
      content: `You are a helpful assistant that can search, read, edit, and create files in Google Drive. 
When users ask about their files, use the available tools to help them. 
Be conversational and helpful. Always confirm actions before making changes to files.`
    };

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      systemMessage,
      ...history,
      { role: 'user', content: userMessage }
    ];

    let response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      tools,
      tool_choice: 'auto'
    });

    let assistantMessage = response.choices[0].message;
    let finalResponse = '';

    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let toolResult: any;
        try {
          // Set current user for MCP service
          mcpServerService.setCurrentUser(userId);
          
          switch (functionName) {
            case 'search_drive_files':
              toolResult = await mcpServerService.searchFiles(functionArgs.query, functionArgs.maxResults);
              break;
            case 'read_drive_file':
              toolResult = await mcpServerService.getFileContent(functionArgs.fileId);
              break;
            case 'edit_drive_file':
              toolResult = await mcpServerService.editFile(functionArgs.fileId, functionArgs.content, functionArgs.mimeType);
              break;
            case 'create_drive_file':
              toolResult = await mcpServerService.createFile(functionArgs.name, functionArgs.content, functionArgs.mimeType, functionArgs.parentFolderId);
              break;
            default:
              toolResult = { error: `Unknown function: ${functionName}` };
          }
        } catch (error) {
          toolResult = { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }

      response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        tools,
        tool_choice: 'auto'
      });

      assistantMessage = response.choices[0].message;
    }

    finalResponse = assistantMessage.content || 'I apologize, but I could not generate a response.';

    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: finalResponse });
    
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }
    
    this.conversationHistory.set(userId, history);

    return finalResponse;
  }

  clearHistory(userId: string): void {
    this.conversationHistory.delete(userId);
  }

  async processWebContent(
    userId: string,
    webContent: {
      title: string;
      url: string;
      content: string;
      timestamp?: string;
    },
    automation: {
      title: string;
      storeTo: string;
      extract?: string[];
      automationPrompt?: string;
      googleFileId?: string;
      googleFileName?: string;
    }
  ): Promise<{ success: boolean; message: string; details?: any }> {
    console.log('\n========================================');
    console.log('[LLM] 🚀 Starting LLM-based web content processing');
    console.log('========================================');
    console.log('[LLM] 📄 Content:', {
      title: webContent.title,
      url: webContent.url,
      contentLength: webContent.content.length,
      timestamp: webContent.timestamp || new Date().toISOString()
    });
    console.log('[LLM] 🎯 Automation:', {
      title: automation.title,
      storeTo: automation.storeTo,
      extractFields: automation.extract,
      customPrompt: automation.automationPrompt
    });

    mcpServerService.setCurrentUser(userId);

    const fileIdInstruction = automation.googleFileId 
      ? `Use file ID: ${automation.googleFileId} (File name: ${automation.googleFileName || 'Unknown'})` 
      : `Search for file named: ${automation.storeTo}`;

    const userPrompt = `You are an intelligent automation assistant processing web content to store in Google Drive.

WEB CONTENT:
Title: ${webContent.title}
URL: ${webContent.url}
Timestamp: ${webContent.timestamp || new Date().toISOString()}

Content:
${webContent.content}

AUTOMATION TASK:
Automation Name: ${automation.title}
Target File: ${fileIdInstruction}
${automation.extract ? `Fields to Extract: ${Array.isArray(automation.extract) ? automation.extract.join(', ') : automation.extract}` : ''}
${automation.automationPrompt ? `Custom Instructions: ${automation.automationPrompt}` : ''}

YOUR TASK:
${automation.googleFileId ? `1. Read the file with ID ${automation.googleFileId} to understand the existing format and structure` : `1. Search for the file "${automation.storeTo}" in Google Drive`}
2. ${automation.googleFileId ? 'Based' : 'If the file exists, read its content. Based'} on the file type (Google Sheet, Google Doc, or plain text):
   - For Google Sheets: Analyze the column headers and existing data format, then append a new row with the extracted information
   - For Google Docs: Analyze the writing style and structure of existing entries, then append a new entry that matches the style
   - For plain text files: Append the content in an appropriate format
3. ${automation.automationPrompt ? 'Follow the custom instructions provided.' : 'Match the existing format and structure of the document.'}
4. Extract relevant information from the web content and format it appropriately
5. Append the new entry to the file

Important:
- Always analyze existing content before adding new content
- Maintain consistency with the existing format and style
${automation.googleFileId ? '- You MUST use the provided file ID, do not search for or edit any other files' : '- If the file doesn\'t exist, create it with an appropriate structure'}
- For sheets, ensure data is properly formatted for each column
- For docs, maintain the same writing style and structure as existing entries`;

    const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
      role: 'system',
      content: `You are an intelligent automation assistant that processes web content and stores it in Google Drive.

You have access to Google Drive tools to:
- Search for files (only if no file ID is provided)
- Read file contents
- Edit existing files
- Create new files (only if no file ID is provided)

When processing web content:
1. If a file ID is provided, use ONLY that file ID and do not search for or edit any other files
2. Always analyze the target file first to understand its format
3. Extract relevant information from the web content
4. Format the data to match the existing file structure
5. Append the new entry maintaining consistency with existing content

CRITICAL: If a file ID is provided in the user prompt, you MUST use that exact file ID and never search for files by name.

Be thorough in your analysis and ensure data is properly formatted.`
    };

    const tools: OpenAI.Chat.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'search_drive_files',
          description: 'Search for files in Google Drive by name or content. ONLY use this if no file ID was provided in the user prompt.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query to find files'
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of results to return (default: 10)'
              }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'read_drive_file',
          description: 'Read the content of a Google Drive file. For Google Sheets, returns CSV format. For Google Docs, returns plain text.',
          parameters: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'The ID of the file to read'
              }
            },
            required: ['fileId']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'edit_drive_file',
          description: 'Edit/overwrite the content of an existing Google Drive file. Use this carefully as it replaces all content.',
          parameters: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'The ID of the file to edit'
              },
              content: {
                type: 'string',
                description: 'New content for the file'
              },
              mimeType: {
                type: 'string',
                description: 'MIME type of the content (optional)'
              }
            },
            required: ['fileId', 'content']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'create_drive_file',
          description: 'Create a new file in Google Drive. ONLY use this if no file ID was provided in the user prompt.',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the new file'
              },
              content: {
                type: 'string',
                description: 'Content of the new file'
              },
              mimeType: {
                type: 'string',
                description: 'MIME type of the file (e.g., text/plain, application/json)'
              },
              parentFolderId: {
                type: 'string',
                description: 'Parent folder ID (optional)'
              }
            },
            required: ['name', 'content', 'mimeType']
          }
        }
      }
    ];

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      systemMessage,
      { role: 'user', content: userPrompt }
    ];

    console.log('[LLM] 🤖 Calling GPT-4-turbo with MCP tools...\n');

    let response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      tools,
      tool_choice: 'auto'
    });

    let assistantMessage = response.choices[0].message;
    let stepCount = 0;

    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      stepCount++;
      console.log(`[LLM] 🔄 Step ${stepCount}: Processing ${assistantMessage.tool_calls.length} tool call(s)`);
      
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[LLM] 📞 Tool Call: ${functionName}`);
        console.log(`[LLM] 📦 Arguments:`, JSON.stringify(functionArgs, null, 2));

        let toolResult: any;
        try {
          mcpServerService.setCurrentUser(userId);
          
          switch (functionName) {
            case 'search_drive_files':
              console.log(`[LLM] 🔍 Searching for files matching: "${functionArgs.query}"`);
              toolResult = await mcpServerService.searchFiles(functionArgs.query, functionArgs.maxResults);
              console.log(`[LLM] ✓ Found ${toolResult.length} file(s)`);
              if (toolResult.length > 0) {
                console.log(`[LLM] 📋 Files:`, toolResult.map((f: any) => ({ name: f.name, id: f.id, mimeType: f.mimeType })));
              }
              break;
            case 'read_drive_file':
              console.log(`[LLM] 📖 Reading file: ${functionArgs.fileId}`);
              toolResult = await mcpServerService.getFileContent(functionArgs.fileId);
              console.log(`[LLM] ✓ Read ${toolResult.length} characters`);
              console.log(`[LLM] 📄 Content preview (first 200 chars):\n${toolResult.substring(0, 200)}...`);
              break;
            case 'edit_drive_file':
              console.log(`[LLM] ✏️  Editing file: ${functionArgs.fileId}`);
              console.log(`[LLM] 📝 New content length: ${functionArgs.content.length} characters`);
              toolResult = await mcpServerService.editFile(functionArgs.fileId, functionArgs.content, functionArgs.mimeType);
              console.log(`[LLM] ✓ File updated successfully`);
              break;
            case 'create_drive_file':
              console.log(`[LLM] 📝 Creating new file: ${functionArgs.name}`);
              console.log(`[LLM] 📄 MIME type: ${functionArgs.mimeType}`);
              toolResult = await mcpServerService.createFile(functionArgs.name, functionArgs.content, functionArgs.mimeType, functionArgs.parentFolderId);
              console.log(`[LLM] ✓ File created with ID: ${toolResult.id}`);
              break;
            default:
              toolResult = { error: `Unknown function: ${functionName}` };
              console.log(`[LLM] ❌ Unknown function: ${functionName}`);
          }
        } catch (error) {
          toolResult = { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
          console.log(`[LLM] ❌ Error in ${functionName}:`, toolResult.error);
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }

      console.log(`[LLM] 🤖 Getting next response from GPT-4-turbo...\n`);

      response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        tools,
        tool_choice: 'auto'
      });

      assistantMessage = response.choices[0].message;
    }

    const finalResponse = assistantMessage.content || 'Processing completed.';
    
    console.log('[LLM] ✅ LLM processing complete');
    console.log('[LLM] 💬 Final response:', finalResponse);
    console.log('[LLM] 📊 Total steps:', stepCount);
    console.log('========================================\n');

    return {
      success: true,
      message: finalResponse,
      details: {
        steps: stepCount,
        automation: automation.title,
        targetFile: automation.storeTo
      }
    };
  }
}

export const gptService = new GPTService();