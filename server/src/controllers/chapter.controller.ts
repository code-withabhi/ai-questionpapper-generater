import { Response } from 'express';
import { Chapter } from '../models/Chapter.js';
import { Subject } from '../models/Subject.js';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const createChapterSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  order: z.number().int().min(0).optional(),
});

const updateChapterSchema = createChapterSchema.partial();

export const createChapter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const data = createChapterSchema.parse(req.body);
    const subject = await Subject.findById(data.subjectId);
    
    if (!subject) {
      throw new AppError(404, 'Subject not found');
    }

    if (subject.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Only subject owner can create chapters');
    }

    if (data.order === undefined) {
      const maxOrderChapter = await Chapter.findOne({ subjectId: data.subjectId })
        .sort({ order: -1 })
        .limit(1);
      data.order = maxOrderChapter ? maxOrderChapter.order + 1 : 0;
    }

    const chapter = await Chapter.create(data);
    logger.info({ userId: req.user.userId, chapterId: chapter._id }, 'Chapter created');
    res.status(201).json(chapter);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Create chapter error');
    throw new AppError(500, 'Failed to create chapter');
  }
};

export const getChaptersBySubject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) {
      throw new AppError(404, 'Subject not found');
    }

    if (subject.ownerId.toString() !== req.user.userId && !subject.shared) {
      throw new AppError(403, 'Access denied');
    }

    const chapters = await Chapter.find({ subjectId: req.params.subjectId })
      .sort({ order: 1 })
      .lean();

    res.json(chapters);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Get chapters error');
    throw new AppError(500, 'Failed to fetch chapters');
  }
};

export const getChapterById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      throw new AppError(404, 'Chapter not found');
    }

    const subject = await Subject.findById(chapter.subjectId);
    if (!subject) {
      throw new AppError(404, 'Subject not found');
    }

    if (subject.ownerId.toString() !== req.user.userId && !subject.shared) {
      throw new AppError(403, 'Access denied');
    }

    res.json(chapter);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Get chapter error');
    throw new AppError(500, 'Failed to fetch chapter');
  }
};

export const updateChapter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const data = updateChapterSchema.parse(req.body);
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      throw new AppError(404, 'Chapter not found');
    }

    const subject = await Subject.findById(chapter.subjectId);
    if (!subject || (subject.ownerId.toString() !== req.user.userId && req.user.role !== 'admin')) {
      throw new AppError(403, 'Only subject owner can update chapters');
    }

    Object.assign(chapter, data);
    await chapter.save();
    logger.info({ userId: req.user.userId, chapterId: chapter._id }, 'Chapter updated');
    res.json(chapter);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Update chapter error');
    throw new AppError(500, 'Failed to update chapter');
  }
};

export const deleteChapter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      throw new AppError(404, 'Chapter not found');
    }

    const subject = await Subject.findById(chapter.subjectId);
    if (!subject || (subject.ownerId.toString() !== req.user.userId && req.user.role !== 'admin')) {
      throw new AppError(403, 'Only subject owner can delete chapters');
    }

    await chapter.deleteOne();
    logger.info({ userId: req.user.userId, chapterId: chapter._id }, 'Chapter deleted');
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Delete chapter error');
    throw new AppError(500, 'Failed to delete chapter');
  }
};

export const reorderChapters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const { subjectId, chapterOrders } = req.body as {
      subjectId: string;
      chapterOrders: Array<{ id: string; order: number }>;
    };

    const subject = await Subject.findById(subjectId);
    if (!subject || (subject.ownerId.toString() !== req.user.userId && req.user.role !== 'admin')) {
      throw new AppError(403, 'Only subject owner can reorder chapters');
    }

    await Promise.all(
      chapterOrders.map((item) => Chapter.findByIdAndUpdate(item.id, { order: item.order }))
    );

    logger.info({ userId: req.user.userId, subjectId }, 'Chapters reordered');
    res.json({ message: 'Chapters reordered successfully' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Reorder chapters error');
    throw new AppError(500, 'Failed to reorder chapters');
  }
};
