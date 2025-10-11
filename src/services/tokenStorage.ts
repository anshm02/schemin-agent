import { GoogleTokens } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

const TOKENS_FILE = path.join(process.cwd(), 'tokens.json');

export class TokenStorage {
  private tokens: Map<string, GoogleTokens> = new Map();

  async init(): Promise<void> {
    try {
      const data = await fs.readFile(TOKENS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.tokens = new Map(Object.entries(parsed));
    } catch (error) {
      this.tokens = new Map();
    }
  }

  async saveTokens(userId: string, tokens: GoogleTokens): Promise<void> {
    this.tokens.set(userId, tokens);
    await this.persist();
  }

  async getTokens(userId: string): Promise<GoogleTokens | null> {
    return this.tokens.get(userId) || null;
  }

  async deleteTokens(userId: string): Promise<void> {
    this.tokens.delete(userId);
    await this.persist();
  }

  private async persist(): Promise<void> {
    const obj = Object.fromEntries(this.tokens);
    await fs.writeFile(TOKENS_FILE, JSON.stringify(obj, null, 2));
  }
}

export const tokenStorage = new TokenStorage();

