import OpenAI from 'openai';
import { googleAuthService } from './googleAuth';
import { googleDriveService } from './googleDrive';

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
          const auth = await googleAuthService.getAuthenticatedClient(userId);
          
          switch (functionName) {
            case 'search_drive_files':
              toolResult = await googleDriveService.searchFiles(auth, functionArgs);
              break;
            case 'read_drive_file':
              toolResult = await googleDriveService.getFileContent(auth, functionArgs.fileId);
              break;
            case 'edit_drive_file':
              toolResult = await googleDriveService.editFile(auth, functionArgs);
              break;
            case 'create_drive_file':
              toolResult = await googleDriveService.createFile(auth, functionArgs);
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

  async summarizeArticle(userId: string, prompt: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that creates clear, concise summaries of articles. Focus on the main points, key arguments, and important details. Format your summaries in a readable way with bullet points or paragraphs as appropriate.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content || 'Could not generate summary.';
  }
}

export const gptService = new GPTService();

