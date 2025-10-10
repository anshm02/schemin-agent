import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { DriveFile, DriveSearchParams, DriveEditParams, DriveCreateParams } from '../types';
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
}

export const googleDriveService = new GoogleDriveService();

