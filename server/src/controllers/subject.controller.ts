import { Response } from 'express';
import { Subject } from '../models/Subject.js';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const createSubjectSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().max(50).optional(),
  course: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  shared: z.boolean().optional(),
});

const updateSubjectSchema = createSubjectSchema.partial();

export const createSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const data = createSubjectSchema.parse(req.body);

    const subject = await Subject.create({
      ...data,
      ownerId: req.user.userId,
    });

    logger.info({ userId: req.user.userId, subjectId: subject._id }, 'Subject created');

    res.status(201).json(subject);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error({ err: error }, 'Create subject error');
    throw new AppError(500, 'Failed to create subject');
  }
};

export const getSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Users can see their own subjects or shared subjects
    const query: any = {
      $or: [{ ownerId: req.user.userId }, { shared: true }],
    };

    // Filter by course if provided
    if (req.query.course) {
      query.course = req.query.course;
    }

    // Search by name if provided
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    const [subjects, total] = await Promise.all([
      Subject.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Subject.countDocuments(query),
    ]);

    res.json({
      data: subjects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Get subjects error');
    throw new AppError(500, 'Failed to fetch subjects');
  }
};

export const getSubjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      throw new AppError(404, 'Subject not found');
    }

    // Check access: owner or shared
    if (
      subject.ownerId.toString() !== req.user.userId &&
      !subject.shared
    ) {
      throw new AppError(403, 'Access denied');
    }

    res.json(subject);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error({ err: error }, 'Get subject error');
    throw new AppError(500, 'Failed to fetch subject');
  }
};

export const updateSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const data = updateSubjectSchema.parse(req.body);

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      throw new AppError(404, 'Subject not found');
    }

    // Only owner can update (or admin)
    if (
      subject.ownerId.toString() !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      throw new AppError(403, 'Only the owner can update this subject');
    }

    Object.assign(subject, data);
    await subject.save();

    logger.info({ userId: req.user.userId, subjectId: subject._id }, 'Subject updated');

    res.json(subject);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error({ err: error }, 'Update subject error');
    throw new AppError(500, 'Failed to update subject');
  }
};

export const deleteSubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      throw new AppError(404, 'Subject not found');
    }

    // Only owner can delete (or admin)
    if (
      subject.ownerId.toString() !== req.user.userId &&
      req.user.role !== 'admin'
    ) {
      throw new AppError(403, 'Only the owner can delete this subject');
    }

    await subject.deleteOne();

    logger.info({ userId: req.user.userId, subjectId: subject._id }, 'Subject deleted');

    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error({ err: error }, 'Delete subject error');
    throw new AppError(500, 'Failed to delete subject');
  }
};
