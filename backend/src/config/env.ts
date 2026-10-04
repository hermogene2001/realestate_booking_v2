import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '5001', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  BLOCKCHAIN_RPC_URL: process.env.BLOCKCHAIN_RPC_URL || '',
  BLOCKCHAIN_WS_URL: process.env.BLOCKCHAIN_WS_URL || '',
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '',
  ADMIN_WALLET_ADDRESS: process.env.ADMIN_WALLET_ADDRESS || '',
  ADMIN_WALLET_PRIVATE_KEY: process.env.ADMIN_WALLET_PRIVATE_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Email Configuration
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || '587',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'noreply@kigali-re.com',
  
  // Redis Configuration
  REDIS_URL: process.env.REDIS_URL || '',
  
  // Sentry Configuration
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',

  // Gemini Configuration
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',

  // Ollama Configuration (Local LLM)
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'mistral',
  OLLAMA_ENABLED: process.env.OLLAMA_ENABLED === 'true',

  // Contract Addresses
  PROPERTY_TOKEN_ADDRESS: process.env.PROPERTY_TOKEN_ADDRESS || '',
  REPUTATION_SCORE_ADDRESS: process.env.REPUTATION_SCORE_ADDRESS || '',
};
