import dotenv from 'dotenv';
import app from './server';
import { tokenStorage } from './services/tokenStorage';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function validateEnvironment(): Promise<void> {
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'OPENAI_API_KEY',
    'SESSION_SECRET'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(varName => console.error(`  - ${varName}`));
    console.error('\nPlease create a .env file with the required variables.');
    console.error('See .env.example for reference.');
    process.exit(1);
  }
}

async function startServer(): Promise<void> {
  try {
    await validateEnvironment();
    
    await tokenStorage.init();
    console.log('Token storage initialized');

    app.listen(PORT, () => {
      console.log(`\n🚀 Google Drive AI Assistant is running!`);
      console.log(`\n📍 Open your browser and navigate to: http://localhost:${PORT}`);
      console.log(`\n🔐 You will be prompted to sign in with Google`);
      console.log(`\n💡 Once authenticated, you can chat with your Google Drive files\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

