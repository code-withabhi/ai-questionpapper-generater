import crypto from 'crypto';

export function generateHash(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
  
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}
