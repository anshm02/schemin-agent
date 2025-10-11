import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { googleAuthService } from './googleAuth';
import { googleDriveService } from './googleDrive';
import { MCPResponse } from '../types';

export class MCPServerService {
  private server: Server;
  private currentUserId: string = 'default_user';

  constructor() {
    this.server = new Server(
      {
        name: 'google-drive-mcp',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupHandlers();
  }

  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'search_drive_files',
          description: 'Search for files in Google Drive by name or content',
          inputSchema: {
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
        },
        {
          name: 'read_drive_file',
          description: 'Read the content of a Google Drive file',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'The ID of the file to read'
              }
            },
            required: ['fileId']
          }
        },
        {
          name: 'edit_drive_file',
          description: 'Edit the content of an existing Google Drive file',
          inputSchema: {
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
        },
        {
          name: 'create_drive_file',
          description: 'Create a new file in Google Drive',
          inputSchema: {
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
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const auth = await googleAuthService.getAuthenticatedClient(this.currentUserId);
        
        switch (request.params.name) {
          case 'search_drive_files': {
            const { query, maxResults } = request.params.arguments as any;
            const files = await googleDriveService.searchFiles(auth, { query, maxResults });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(files, null, 2)
                }
              ]
            };
          }

          case 'read_drive_file': {
            const { fileId } = request.params.arguments as any;
            const content = await googleDriveService.getFileContent(auth, fileId);
            return {
              content: [
                {
                  type: 'text',
                  text: content
                }
              ]
            };
          }

          case 'edit_drive_file': {
            const { fileId, content, mimeType } = request.params.arguments as any;
            const result = await googleDriveService.editFile(auth, { fileId, content, mimeType });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          case 'create_drive_file': {
            const { name, content, mimeType, parentFolderId } = request.params.arguments as any;
            const result = await googleDriveService.createFile(auth, { 
              name, 
              content, 
              mimeType, 
              parentFolderId 
            });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: errorMessage })
            }
          ],
          isError: true
        };
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  getServer(): Server {
    return this.server;
  }
}

export const mcpServerService = new MCPServerService();

