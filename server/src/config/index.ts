import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

interface Config {
  env: string;
  port: number;
  mongodb: {
    uri: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpire: string;
    refreshExpire: string;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  cors: {
    allowedOrigins: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    aiMaxRequests: number;
  };
  upload: {
    maxFileSizeMB: number;
  };
  logging: {
    level: string;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-question-paper-generator',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-min-32-chars-long',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-min-32-chars-long',
    accessExpire: process.env.JWT_ACCESS_EXPIRE || '15m',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    aiMaxRequests: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || '10', 10),
  },
  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
