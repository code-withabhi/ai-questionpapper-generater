import { Response } from 'express';
import { Topic } from '../models/Topic.js';
import { Chapter } from '../models/Chapter.js';
import { Subject } from '../models/Subject.js';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

const createTopicSchema = z.object({
  chapterId: z.string().min(1),
  subjectId: z.string().min(1),
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  learningObjectives: z.array(z.string().max(500)).optional(),
  order: z.number().int().min(0).optional(),
});

const updateTopicSchema = createTopicSchema.partial();

export const createTopic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const data = createTopicSchema.parse(req.body);
    const [chapter, subject] = await Promise.all([
      Chapter.findById(data.chapterId),
      Subject.findById(data.subjectId),
    ]);

    if (!chapter || !subject) {
      throw new AppError(404, 'Chapter or subject not found');
    }

    if (chapter.subjectId.toString() !== data.subjectId) {
      throw new AppError(400, 'Chapter does not belong to this subject');
    }

    if (subject.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Only subject owner can create topics');
    }

    if (data.order === undefined) {
      const maxTopic = await Topic.findOne({ chapterId: data.chapterId })
        .sort({ order: -1 })
        .limit(1);
      data.order = maxTopic ? maxTopic.order + 1 : 0;
    }

    const topic = await Topic.create(data);
    logger.info({ userId: req.user.userId, topicId: topic._id }, 'Topic created');
    res.status(201).json(topic);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Create topic error');
    throw new AppError(500, 'Failed to create topic');
  }
};

export const getTopicsByChapter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter) throw new AppError(404, 'Chapter not found');

    const subject = await Subject.findById(chapter.subjectId);
    if (!subject || (subject.ownerId.toString() !== req.user.userId && !subject.shared)) {
      throw new AppError(403, 'Access denied');
    }

    const topics = await Topic.find({ chapterId: req.params.chapterId })
      .sort({ order: 1 })
      .lean();

    res.json(topics);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Get topics error');
    throw new AppError(500, 'Failed to fetch topics');
  }
};

export const getTopicById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const topic = await Topic.findById(req.params.id);
    if (!topic) throw new AppError(404, 'Topic not found');

    const subject = await Subject.findById(topic.subjectId);
    if (!subject || (subject.ownerId.toString() !== req.user.userId && !subject.shared)) {
      throw new AppError(403, 'Access denied');
    }

    res.json(topic);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Get topic error');
    throw new AppError(500, 'Failed to fetch topic');
  }
};

export const updateTopic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const data = updateTopicSchema.parse(req.body);
    const topic = await Topic.findById(req.params.id);
    if (!topic) throw new AppError(404, 'Topic not found');

    const subject = await Subject.findById(topic.subjectId);
    if (!subject || (subject.ownerId.toString() !== req.user.userId && req.user.role !== 'admin')) {
      throw new AppError(403, 'Only subject owner can update topics');
    }

    Object.assign(topic, data);
    await topic.save();
    logger.info({ userId: req.user.userId, topicId: topic._id }, 'Topic updated');
    res.json(topic);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Update topic error');
    throw new AppError(500, 'Failed to update topic');
  }
};

export const deleteTopic = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const topic = await Topic.findById(req.params.id);
    if (!topic) throw new AppError(404, 'Topic not found');

    const subject = await Subject.findById(topic.subjectId);
    if (!subject || (subject.ownerId.toString() !== req.user.userId && req.user.role !== 'admin')) {
      throw new AppError(403, 'Only subject owner can delete topics');
    }

    await topic.deleteOne();
    logger.info({ userId: req.user.userId, topicId: topic._id }, 'Topic deleted');
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Delete topic error');
    throw new AppError(500, 'Failed to delete topic');
  }
};

