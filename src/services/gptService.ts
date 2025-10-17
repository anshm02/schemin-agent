import OpenAI from 'openai';
import { googleAuthService } from './googleAuth';
import { mcpServerService } from './mcpServer';
import { FormatAnalysis, SheetFormat, DocFormat } from '../types';

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

  async extractForSheet(
    articleTitle: string,
    articleUrl: string,
    articleContent: string,
    scrollPercentage: number,
    sheetFormat: SheetFormat
  ): Promise<any[]> {
    const prompt = `You are extracting information from an article to fill a Google Sheet row.

Article Details:
- Title: ${articleTitle}
- URL: ${articleUrl}
- Read Progress: ${Math.round(scrollPercentage)}%

Content:
${articleContent}

Sheet Format:
- Columns: ${sheetFormat.headers.join(', ')}
- Column Data Types: ${JSON.stringify(sheetFormat.dataTypes)}
${sheetFormat.exampleRows.length > 0 ? `- Example rows: ${JSON.stringify(sheetFormat.exampleRows)}` : ''}

Instructions:
1. Extract ONLY the information needed for each column
2. Match the data types specified
3. Follow the format of example rows if provided
4. Return a JSON array with values in the exact order of the columns
5. If a column's data is not available in the article, use an appropriate empty/default value

Return ONLY a JSON array, no other text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a data extraction assistant. You extract specific information from articles to populate spreadsheet rows. Always return valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0].message.content || '[]';
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed[0]) ? parsed[0] : parsed;
    } catch (e) {
      const match = content.match(/\[.*\]/s);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed[0]) ? parsed[0] : parsed;
      }
      return sheetFormat.headers.map(() => '');
    }
  }

  async summarizeForDoc(
    articleTitle: string,
    articleUrl: string,
    articleContent: string,
    scrollPercentage: number,
    docFormat: DocFormat
  ): Promise<string> {
    const styleGuidance = this.getStyleGuidance(docFormat);
    const structureGuidance = this.getStructureGuidance(docFormat);
    
    const prompt = `You are creating a summary entry for a Google Doc that already has existing content.

Article Details:
- Title: ${articleTitle}
- URL: ${articleUrl}
- Read Progress: ${Math.round(scrollPercentage)}%

Content:
${articleContent}

Existing Doc Format Analysis:
- Writing Style: ${docFormat.style}
- Structure: ${docFormat.structure}
- Average Entry Length: ${Math.round(docFormat.avgLength)} characters
- Uses Bullet Points: ${docFormat.hasBullets}
- Uses Headings: ${docFormat.hasHeadings}

Example of existing entries:
${docFormat.exampleEntries.slice(0, 2).join('\n---\n')}

Instructions:
${styleGuidance}
${structureGuidance}
- Match the length and detail level of existing entries (around ${Math.round(docFormat.avgLength)} characters)
- Maintain consistency with the existing writing style

Create a summary entry that fits seamlessly with the existing content.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a writing assistant that creates summaries matching a specific style and format. You analyze existing content patterns and replicate them precisely.'
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

  private getStyleGuidance(docFormat: DocFormat): string {
    switch (docFormat.style) {
      case 'bullet_points':
        return '- Use bullet points to organize the information';
      case 'heading_based':
        return '- Use headings to structure the content';
      case 'multi_paragraph':
        return '- Write in multiple paragraphs, breaking down different aspects';
      case 'single_paragraph':
        return '- Write in a single, cohesive paragraph';
      default:
        return '- Match the writing style of the example entries';
    }
  }

  private getStructureGuidance(docFormat: DocFormat): string {
    switch (docFormat.structure) {
      case 'separated_entries':
        return '- Include a separator line (==== or ----) and timestamp\n- Follow the structured format with Date, Title, URL, and Summary sections';
      case 'structured_entries':
        return '- Use labeled sections like "Title:", "URL:", "Summary:" as seen in examples';
      case 'paragraph_format':
        return '- Write in a flowing paragraph format without strict sections';
      default:
        return '- Follow the structure pattern shown in the examples';
    }
  }
}

export const gptService = new GPTService();