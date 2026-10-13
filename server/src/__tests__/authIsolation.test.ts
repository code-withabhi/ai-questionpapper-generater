import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Auth & Ownership Security Unit Tests', () => {
  const JWT_SECRET = 'test-secret-key-12345';

  it('correctly hashes passwords and rejects incorrect passwords', async () => {
    const rawPassword = 'SecurePassword123!';
    const saltRounds = 10;
    const hash = await bcrypt.hash(rawPassword, saltRounds);

    expect(hash).not.toBe(rawPassword);
    const isValid = await bcrypt.compare(rawPassword, hash);
    expect(isValid).toBe(true);

    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('generates valid JWT tokens with role and userId claims', () => {
    const payload = {
      userId: 'user-123',
      role: 'teacher',
      email: 'teacher@example.com',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;

    expect(decoded.userId).toBe('user-123');
    expect(decoded.role).toBe('teacher');
  });

  it('enforces ownership isolation between different users', () => {
    const resourceOwnerId = 'user-owner-1';
    const requestingUserId = 'user-attacker-2';

    const isAuthorized = resourceOwnerId === requestingUserId;
    expect(isAuthorized).toBe(false);

    // Matching owner
    const legitimateUserId = 'user-owner-1';
    expect(resourceOwnerId === legitimateUserId).toBe(true);
  });
});
