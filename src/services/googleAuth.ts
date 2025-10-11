import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { GoogleTokens } from '../types';
import { tokenStorage } from './tokenStorage';
import 'dotenv/config';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  async handleCallback(code: string): Promise<{ userId: string; tokens: GoogleTokens }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    
    this.oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();
    
    const userId = data.email || data.id || 'default_user';
    
    const googleTokens: GoogleTokens = {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token || undefined,
      scope: tokens.scope!,
      token_type: tokens.token_type!,
      expiry_date: tokens.expiry_date!
    };
    
    await tokenStorage.saveTokens(userId, googleTokens);
    
    return { userId, tokens: googleTokens };
  }

  async getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
    const tokens = await tokenStorage.getTokens(userId);
    
    if (!tokens) {
      throw new Error('No tokens found for user. Please authenticate first.');
    }
    
    this.oauth2Client.setCredentials(tokens);
    
    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      const refreshedTokens: GoogleTokens = {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || tokens.refresh_token,
        scope: credentials.scope!,
        token_type: credentials.token_type!,
        expiry_date: credentials.expiry_date!
      };
      
      await tokenStorage.saveTokens(userId, refreshedTokens);
      this.oauth2Client.setCredentials(refreshedTokens);
    }
    
    return this.oauth2Client;
  }

  async revokeAccess(userId: string): Promise<void> {
    const tokens = await tokenStorage.getTokens(userId);
    if (tokens) {
      await this.oauth2Client.revokeToken(tokens.access_token);
      await tokenStorage.deleteTokens(userId);
    }
  }
}

export const googleAuthService = new GoogleAuthService();

