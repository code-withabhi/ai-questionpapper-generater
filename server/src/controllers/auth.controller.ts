import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';
import { AppError } from '../middleware/error.js';
import { AuthRequest } from '../middleware/auth.js';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

interface RefreshTokenPayload {
  userId: string;
  email: string;
  role: 'teacher' | 'admin';
  type: 'refresh';
}

const generateAccessToken = (userId: string, email: string, role: 'teacher' | 'admin'): string => {
  return jwt.sign({ userId, email, role }, config.jwt.secret, {
    expiresIn: config.jwt.accessExpire as any,
  });
};

const generateRefreshToken = (
  userId: string,
  email: string,
  role: 'teacher' | 'admin'
): string => {
  return jwt.sign({ userId, email, role, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpire as any,
  });
};

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError(400, 'User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role || 'teacher',
      status: 'active',
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email, user.role);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info({ userId: user._id, email: user.email }, 'User registered successfully');

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error({ err: error }, 'Registration error');
    throw new AppError(500, 'Registration failed');
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new AppError(403, 'Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.email, user.role);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info({ userId: user._id, email: user.email }, 'User logged in successfully');

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error({ err: error }, 'Login error');
    throw new AppError(500, 'Login failed');
  }
};

export const refresh = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError(401, 'Refresh token not found');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as RefreshTokenPayload;

      if (decoded.type !== 'refresh') {
        throw new AppError(401, 'Invalid token type');
      }

      // Verify user still exists and is active
      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        throw new AppError(401, 'User not found or inactive');
      }

      // Generate new access token
      const accessToken = generateAccessToken(user._id.toString(), user.email, user.role);

      res.json({ accessToken });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(401, 'Invalid refresh token');
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error({ err: error }, 'Token refresh error');
    throw new AppError(500, 'Token refresh failed');
  }
};

export const logout = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) throw new AppError(404, 'User not found');
    res.json({ user });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Get user error');
    throw new AppError(500, 'Failed to fetch user profile');
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new AppError(400, 'Valid name is required (min 2 characters)');
    }
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name: name.trim() },
      { new: true }
    ).select('-passwordHash');
    if (!user) throw new AppError(404, 'User not found');
    logger.info({ userId: user._id }, 'User profile updated');
    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Update profile error');
    throw new AppError(500, 'Failed to update profile');
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new AppError(400, 'New password must be at least 8 characters');
    }
    const user = await User.findById(req.user.userId);
    if (!user) throw new AppError(404, 'User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AppError(400, 'Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    logger.info({ userId: user._id }, 'Password changed successfully');
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Change password error');
    throw new AppError(500, 'Failed to change password');
  }
};
