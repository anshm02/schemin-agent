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

export interface MCPToolCall {
  tool: string;
  parameters: Record<string, any>;
}

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

