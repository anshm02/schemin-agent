import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { DriveFile, DriveSearchParams, DriveEditParams, DriveCreateParams, SheetFormat, DocFormat, FormatAnalysis } from '../types';
import { Readable } from 'stream';

export class GoogleDriveService {
  async searchFiles(auth: OAuth2Client, params: DriveSearchParams): Promise<DriveFile[]> {
    const drive = google.drive({ version: 'v3', auth });
    
    let query = '';
    if (params.query) {
      const sanitizedQuery = params.query.replace(/'/g, "\\'");
      query = `name contains '${sanitizedQuery}' or fullText contains '${sanitizedQuery}'`;
    }
    
    const response = await drive.files.list({
      q: query || undefined,
      pageSize: params.maxResults || 10,
      fields: 'files(id, name, mimeType, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc'
    });
    
    const files = response.data.files || [];
    return files.map(file => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      modifiedTime: file.modifiedTime!,
      webViewLink: file.webViewLink || undefined
    }));
  }

  async getFileContent(auth: OAuth2Client, fileId: string): Promise<string> {
    const drive = google.drive({ version: 'v3', auth });
    
    const file = await drive.files.get({
      fileId,
      fields: 'mimeType'
    });
    
    const mimeType = file.data.mimeType;
    
    if (mimeType?.includes('google-apps')) {
      let exportMimeType = 'text/plain';
      if (mimeType.includes('document')) {
        exportMimeType = 'text/plain';
      } else if (mimeType.includes('spreadsheet')) {
        exportMimeType = 'text/csv';
      } else if (mimeType.includes('presentation')) {
        exportMimeType = 'text/plain';
      }
      
      const response = await drive.files.export(
        { fileId, mimeType: exportMimeType },
        { responseType: 'text' }
      );
      
      return response.data as string;
    } else {
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'text' }
      );
      
      return response.data as string;
    }
  }

  async editFile(auth: OAuth2Client, params: DriveEditParams): Promise<DriveFile> {
    const drive = google.drive({ version: 'v3', auth });
    
    const file = await drive.files.get({
      fileId: params.fileId,
      fields: 'mimeType, name'
    });
    
    const mimeType = params.mimeType || file.data.mimeType || 'text/plain';
    
    const media = {
      mimeType,
      body: Readable.from([params.content])
    };
    
    const response = await drive.files.update({
      fileId: params.fileId,
      media,
      fields: 'id, name, mimeType, modifiedTime, webViewLink'
    });
    
    return {
      id: response.data.id!,
      name: response.data.name!,
      mimeType: response.data.mimeType!,
      modifiedTime: response.data.modifiedTime!,
      webViewLink: response.data.webViewLink || undefined
    };
  }

  async createFile(auth: OAuth2Client, params: DriveCreateParams): Promise<DriveFile> {
    const drive = google.drive({ version: 'v3', auth });
    
    const fileMetadata: any = {
      name: params.name,
      mimeType: params.mimeType
    };
    
    if (params.parentFolderId) {
      fileMetadata.parents = [params.parentFolderId];
    }
    
    const media = {
      mimeType: params.mimeType,
      body: Readable.from([params.content])
    };
    
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, mimeType, modifiedTime, webViewLink'
    });
    
    return {
      id: response.data.id!,
      name: response.data.name!,
      mimeType: response.data.mimeType!,
      modifiedTime: response.data.modifiedTime!,
      webViewLink: response.data.webViewLink || undefined
    };
  }

  async deleteFile(auth: OAuth2Client, fileId: string): Promise<void> {
    const drive = google.drive({ version: 'v3', auth });
    await drive.files.delete({ fileId });
  }

  async appendToFile(auth: OAuth2Client, fileName: string, content: string): Promise<DriveFile> {
    const drive = google.drive({ version: 'v3', auth });
    
    const searchResponse = await drive.files.list({
      q: `name = '${fileName.replace(/'/g, "\\'")}' and trashed = false`,
      pageSize: 1,
      fields: 'files(id, name, mimeType)'
    });
    
    let fileId: string;
    let existingContent = '';
    
    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      fileId = searchResponse.data.files[0].id!;
      existingContent = await this.getFileContent(auth, fileId);
    } else {
      const newFile = await this.createFile(auth, {
        name: fileName,
        content: '',
        mimeType: 'text/plain'
      });
      fileId = newFile.id;
    }
    
    const updatedContent = existingContent 
      ? `${existingContent}\n\n${content}` 
      : content;
    
    return await this.editFile(auth, {
      fileId,
      content: updatedContent,
      mimeType: 'text/plain'
    });
  }

  async getSheetFormat(auth: OAuth2Client, fileId: string): Promise<SheetFormat> {
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: fileId,
    });
    
    const sheet = spreadsheet.data.sheets?.[0];
    const sheetName = sheet?.properties?.title || 'Sheet1';
    
    const range = `${sheetName}!A1:ZZ`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: fileId,
      range: range,
    });
    
    const rows = response.data.values || [];
    const headers = rows.length > 0 ? rows[0].map(h => String(h || '')) : [];
    const dataRows = rows.slice(1);
    
    const dataTypes: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const columnValues = dataRows.map(row => row[idx]).filter(v => v);
      if (columnValues.length === 0) {
        dataTypes[header] = 'text';
      } else if (columnValues.every(v => !isNaN(Number(v)))) {
        dataTypes[header] = 'number';
      } else if (columnValues.every(v => /^\d{4}-\d{2}-\d{2}/.test(String(v)))) {
        dataTypes[header] = 'date';
      } else if (columnValues.every(v => String(v).startsWith('http'))) {
        dataTypes[header] = 'url';
      } else {
        dataTypes[header] = 'text';
      }
    });
    
    return {
      sheetId: fileId,
      sheetName,
      headers,
      columnCount: headers.length,
      rowCount: rows.length,
      dataTypes,
      exampleRows: dataRows.slice(0, 3)
    };
  }

  async appendToSheet(auth: OAuth2Client, fileId: string, values: any[]): Promise<void> {
    const sheets = google.sheets({ version: 'v4', auth });
    
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: fileId,
    });
    
    const sheet = spreadsheet.data.sheets?.[0];
    const sheetName = sheet?.properties?.title || 'Sheet1';
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: fileId,
      range: `${sheetName}!A:A`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values]
      }
    });
  }

  async getDocFormat(auth: OAuth2Client, fileId: string): Promise<DocFormat> {
    const docs = google.docs({ version: 'v1', auth });
    
    const document = await docs.documents.get({
      documentId: fileId,
    });
    
    const content = document.data.body?.content || [];
    const entries: string[] = [];
    let hasBullets = false;
    let hasHeadings = false;
    let totalLength = 0;
    
    for (const element of content) {
      if (element.paragraph) {
        const text = element.paragraph.elements
          ?.map(e => e.textRun?.content || '')
          .join('')
          .trim();
        
        if (text && text.length > 10) {
          entries.push(text);
          totalLength += text.length;
        }
        
        if (element.paragraph.bullet) {
          hasBullets = true;
        }
        
        const style = element.paragraph.paragraphStyle?.namedStyleType;
        if (style && style.includes('HEADING')) {
          hasHeadings = true;
        }
      }
    }
    
    const avgLength = entries.length > 0 ? totalLength / entries.length : 0;
    
    const structure = this.detectDocStructure(entries);
    const style = this.detectDocStyle(entries, hasBullets, hasHeadings);
    
    return {
      style,
      structure,
      avgLength,
      hasBullets,
      hasHeadings,
      exampleEntries: entries.slice(-3)
    };
  }

  private detectDocStructure(entries: string[]): string {
    if (entries.length === 0) return 'empty';
    
    const hasSeparators = entries.some(e => e.includes('====') || e.includes('----'));
    const hasTimestamps = entries.some(e => /\d{4}-\d{2}-\d{2}/.test(e) || /Date:/.test(e));
    const hasTitles = entries.some(e => /Title:/.test(e) || /Article:/.test(e));
    
    if (hasSeparators && hasTimestamps) return 'separated_entries';
    if (hasTitles) return 'structured_entries';
    
    return 'paragraph_format';
  }

  private detectDocStyle(entries: string[], hasBullets: boolean, hasHeadings: boolean): string {
    if (entries.length === 0) return 'unknown';
    
    if (hasHeadings) return 'heading_based';
    if (hasBullets) return 'bullet_points';
    
    const avgParagraphs = entries.filter(e => e.includes('\n')).length / entries.length;
    if (avgParagraphs > 0.5) return 'multi_paragraph';
    
    return 'single_paragraph';
  }

  async appendToDoc(auth: OAuth2Client, fileId: string, content: string): Promise<void> {
    const docs = google.docs({ version: 'v1', auth });
    
    const document = await docs.documents.get({
      documentId: fileId,
    });
    
    const endIndex = document.data.body?.content?.[document.data.body.content.length - 1]?.endIndex || 1;
    
    await docs.documents.batchUpdate({
      documentId: fileId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: endIndex - 1 },
              text: '\n\n' + content
            }
          }
        ]
      }
    });
  }

  async analyzeFileFormat(auth: OAuth2Client, fileName: string): Promise<FormatAnalysis> {
    const drive = google.drive({ version: 'v3', auth });
    
    const searchResponse = await drive.files.list({
      q: `name = '${fileName.replace(/'/g, "\\'")}' and trashed = false`,
      pageSize: 1,
      fields: 'files(id, name, mimeType)'
    });
    
    if (!searchResponse.data.files || searchResponse.data.files.length === 0) {
      return {
        fileType: 'text',
        isEmpty: true
      };
    }
    
    const file = searchResponse.data.files[0];
    const mimeType = file.mimeType || '';
    const fileId = file.id!;
    
    if (mimeType.includes('spreadsheet')) {
      const sheetFormat = await this.getSheetFormat(auth, fileId);
      return {
        fileType: 'sheet',
        isEmpty: sheetFormat.rowCount <= 1,
        sheetFormat
      };
    } else if (mimeType.includes('document')) {
      const docFormat = await this.getDocFormat(auth, fileId);
      return {
        fileType: 'doc',
        isEmpty: docFormat.exampleEntries.length === 0,
        docFormat
      };
    } else {
      const content = await this.getFileContent(auth, fileId);
      return {
        fileType: 'text',
        isEmpty: content.trim().length === 0
      };
    }
  }
}

export const googleDriveService = new GoogleDriveService();

