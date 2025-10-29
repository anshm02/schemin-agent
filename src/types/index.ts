export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface UserSession {
  userId: string;
  tokens: GoogleTokens;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
}

export interface DriveSearchParams {
  query: string;
  maxResults?: number;
}

export interface DriveEditParams {
  fileId: string;
  content: string;
  mimeType?: string;
}

export interface DriveCreateParams {
  name: string;
  content: string;
  mimeType: string;
  parentFolderId?: string;
}

export interface SheetFormat {
  sheetId: string;
  sheetName: string;
  headers: string[];
  columnCount: number;
  rowCount: number;
  dataTypes: Record<string, string>;
  exampleRows: any[][];
}

export interface DocFormat {
  style: string;
  structure: string;
  avgLength: number;
  hasBullets: boolean;
  hasHeadings: boolean;
  exampleEntries: string[];
}

export interface FormatAnalysis {
  fileType: 'sheet' | 'doc' | 'text';
  isEmpty: boolean;
  sheetFormat?: SheetFormat;
  docFormat?: DocFormat;
}

