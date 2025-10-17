import { googleAuthService } from './googleAuth';
import { googleDriveService } from './googleDrive';

/**
 * MCP Server Service - Internal abstraction layer for Google Drive operations
 * 
 * This service provides a clean interface for all Google Drive, Sheets, and Docs operations.
 * It wraps the googleDriveService with MCP-style tools and adds comprehensive logging.
 * 
 * Note: This is used internally as a direct call interface, not exposed via MCP protocol.
 * To expose as an external MCP server, add back the MCP protocol handlers and stdio transport.
 */
export class MCPServerService {
  private currentUserId: string = 'default_user';

  constructor() {
    console.log('[MCP] 🚀 MCP Server Service initialized (internal mode)');
  }

  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  // Direct call methods for internal use (bypassing MCP protocol)
  async callTool(toolName: string, args: any): Promise<any> {
    console.log(`\n[MCP] 🔧 Calling tool: ${toolName}`);
    console.log(`[MCP] 📥 Args:`, JSON.stringify(args, null, 2));
    
    try {
      const auth = await googleAuthService.getAuthenticatedClient(this.currentUserId);
      let result: any;
      
      switch (toolName) {
        case 'search_drive_files':
          console.log(`[MCP] 🔍 Searching Drive files...`);
          result = await googleDriveService.searchFiles(auth, args);
          console.log(`[MCP] ✓ Found ${result.length} files`);
          return result;
        
        case 'read_drive_file':
          console.log(`[MCP] 📖 Reading file: ${args.fileId}`);
          result = await googleDriveService.getFileContent(auth, args.fileId);
          console.log(`[MCP] ✓ Read ${result.length} characters`);
          return result;
        
        case 'edit_drive_file':
          console.log(`[MCP] ✏️  Editing file: ${args.fileId}`);
          result = await googleDriveService.editFile(auth, args);
          console.log(`[MCP] ✓ File updated`);
          return result;
        
        case 'create_drive_file':
          console.log(`[MCP] 📝 Creating file: ${args.name}`);
          result = await googleDriveService.createFile(auth, args);
          console.log(`[MCP] ✓ File created with ID: ${result.id}`);
          return result;
        
        case 'get_sheet_format':
          console.log(`[MCP] 📊 Analyzing sheet format...`);
          result = await googleDriveService.getSheetFormat(auth, args.fileId);
          console.log(`[MCP] ✓ Sheet has ${result.headers.length} columns, ${result.rowCount} rows`);
          return result;
        
        case 'append_to_sheet':
          console.log(`[MCP] 📝 Appending row to sheet (${args.values.length} values)`);
          await googleDriveService.appendToSheet(auth, args.fileId, args.values);
          console.log(`[MCP] ✓ Row appended successfully via MCP`);
          return { success: true, message: 'Row appended successfully' };
        
        case 'get_doc_format':
          console.log(`[MCP] 📄 Analyzing doc format...`);
          result = await googleDriveService.getDocFormat(auth, args.fileId);
          console.log(`[MCP] ✓ Doc style: ${result.style}, structure: ${result.structure}`);
          return result;
        
        case 'append_to_doc':
          console.log(`[MCP] 📝 Appending to doc (${args.content.length} chars)`);
          await googleDriveService.appendToDoc(auth, args.fileId, args.content);
          console.log(`[MCP] ✓ Content appended to doc via MCP`);
          return { success: true, message: 'Content appended successfully' };
        
        case 'analyze_file_format':
          console.log(`[MCP] 🔍 Analyzing file format: ${args.fileName}`);
          result = await googleDriveService.analyzeFileFormat(auth, args.fileName);
          console.log(`[MCP] ✓ File type: ${result.fileType}, isEmpty: ${result.isEmpty}`);
          return result;
        
        case 'append_to_file':
          console.log(`[MCP] 📝 Appending to file: ${args.fileName}`);
          result = await googleDriveService.appendToFile(auth, args.fileName, args.content);
          console.log(`[MCP] ✓ Content appended to file via MCP`);
          return result;
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[MCP] ❌ Error in ${toolName}:`, errorMessage);
      throw new Error(`MCP Tool Error (${toolName}): ${errorMessage}`);
    }
  }

  // Convenience methods that match the googleDriveService interface
  async searchFiles(query: string, maxResults?: number): Promise<any> {
    return this.callTool('search_drive_files', { query, maxResults });
  }

  async getFileContent(fileId: string): Promise<string> {
    return this.callTool('read_drive_file', { fileId });
  }

  async editFile(fileId: string, content: string, mimeType?: string): Promise<any> {
    return this.callTool('edit_drive_file', { fileId, content, mimeType });
  }

  async createFile(name: string, content: string, mimeType: string, parentFolderId?: string): Promise<any> {
    return this.callTool('create_drive_file', { name, content, mimeType, parentFolderId });
  }

  async getSheetFormat(fileId: string): Promise<any> {
    return this.callTool('get_sheet_format', { fileId });
  }

  async appendToSheet(fileId: string, values: any[]): Promise<void> {
    await this.callTool('append_to_sheet', { fileId, values });
  }

  async getDocFormat(fileId: string): Promise<any> {
    return this.callTool('get_doc_format', { fileId });
  }

  async appendToDoc(fileId: string, content: string): Promise<void> {
    await this.callTool('append_to_doc', { fileId, content });
  }

  async analyzeFileFormat(fileName: string): Promise<any> {
    return this.callTool('analyze_file_format', { fileName });
  }

  async appendToFile(fileName: string, content: string): Promise<any> {
    return this.callTool('append_to_file', { fileName, content });
  }
}

export const mcpServerService = new MCPServerService();

