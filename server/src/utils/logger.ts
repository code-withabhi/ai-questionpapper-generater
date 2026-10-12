import pino from 'pino';
import config from '../config/index.js';

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.apiKey',
  '*.secret',
];

export const logger = pino({
  level: config.logging.level,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  transport:
    config.env === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
