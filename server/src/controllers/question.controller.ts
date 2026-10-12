import { Response } from 'express';
import { Question } from '../models/Question.js';
import { Subject } from '../models/Subject.js';
import { Topic } from '../models/Topic.js';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';

// Validation schemas
const mcqOptionSchema = z.object({
  text: z.string().min(1),
  isCorrect: z.boolean(),
});

const createQuestionSchema = z.object({
  subjectId: z.string().min(1),
  topicId: z.string().min(1),
  chapterId: z.string().min(1),
  type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'essay']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().int().min(1).max(100),
  text: z.string().min(5).max(2000),
  options: z.array(mcqOptionSchema).optional(),
  correctAnswer: z.string().optional(),
  sampleAnswer: z.string().max(5000).optional(),
  explanation: z.string().max(2000).optional(),
  bloomLevel: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

const updateQuestionSchema = createQuestionSchema.partial();

export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const data = createQuestionSchema.parse(req.body);

    // Validate type-specific requirements
    if (data.type === 'multiple-choice') {
      if (!data.options || data.options.length < 2) {
        throw new AppError(400, 'Multiple choice questions need at least 2 options');
      }
      const correctCount = data.options.filter((opt) => opt.isCorrect).length;
      if (correctCount === 0) {
        throw new AppError(400, 'At least one option must be correct');
      }
    }

    if (data.type === 'true-false' && !data.correctAnswer) {
      throw new AppError(400, 'True/False questions must have a correct answer');
    }

    // Verify ownership
    const subject = await Subject.findById(data.subjectId);
    if (!subject || subject.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Only subject owner can create questions');
    }

    // Verify topic exists
    const topic = await Topic.findById(data.topicId);
    if (!topic) {
      throw new AppError(404, 'Topic not found');
    }

    const question = await Question.create(data);
    logger.info({ userId: req.user.userId, questionId: question._id }, 'Question created');
    res.status(201).json(question);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Create question error');
    throw new AppError(500, 'Failed to create question');
  }
};

export const getQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const {
      subjectId, chapterId, topicId, type, difficulty, minMarks, maxMarks,
      bloomLevel, tags, search, page = '1', limit = '20',
      sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const filter: any = {};
    if (subjectId) filter.subjectId = subjectId;
    if (chapterId) filter.chapterId = chapterId;
    if (topicId) filter.topicId = topicId;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (bloomLevel) filter.bloomLevel = bloomLevel;

    if (minMarks || maxMarks) {
      filter.marks = {};
      if (minMarks) filter.marks.$gte = parseInt(minMarks as string);
      if (maxMarks) filter.marks.$lte = parseInt(maxMarks as string);
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    if (search) filter.$text = { $search: search as string };

    // Access control
    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (!subject || (subject.ownerId.toString() !== req.user.userId && !subject.shared)) {
        throw new AppError(403, 'Access denied');
      }
    } else {
      const userSubjects = await Subject.find({
        $or: [{ ownerId: req.user.userId }, { shared: true }],
      }).select('_id');
      filter.subjectId = { $in: userSubjects.map((s) => s._id) };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort(sortOptions).skip(skip).limit(limitNum)
        .populate('subjectId', 'name code')
        .populate('topicId', 'title').lean(),
      Question.countDocuments(filter),
    ]);

    res.json({
      questions,
      pagination: {
        page: pageNum, limit: limitNum, total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Get questions error');
    throw new AppError(500, 'Failed to fetch questions');
  }
};

export const getQuestionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const question = await Question.findById(req.params.id)
      .populate('subjectId').populate('topicId').populate('chapterId');

    if (!question) throw new AppError(404, 'Question not found');

    const subject = await Subject.findById(question.subjectId);
    if (!subject || (subject.ownerId.toString() !== req.user.userId && !subject.shared)) {
      throw new AppError(403, 'Access denied');
    }

    res.json(question);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Get question error');
    throw new AppError(500, 'Failed to fetch question');
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const data = updateQuestionSchema.parse(req.body);
    const question = await Question.findById(req.params.id);
    if (!question) throw new AppError(404, 'Question not found');

    const subject = await Subject.findById(question.subjectId);
    if (!subject || subject.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Only subject owner can update questions');
    }

    Object.assign(question, data);
    await question.save();
    logger.info({ userId: req.user.userId, questionId: question._id }, 'Question updated');
    res.json(question);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Update question error');
    throw new AppError(500, 'Failed to update question');
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const question = await Question.findById(req.params.id);
    if (!question) throw new AppError(404, 'Question not found');

    const subject = await Subject.findById(question.subjectId);
    if (!subject || subject.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Only subject owner can delete questions');
    }

    await question.deleteOne();
    logger.info({ userId: req.user.userId, questionId: question._id }, 'Question deleted');
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Delete question error');
    throw new AppError(500, 'Failed to delete question');
  }
};

export const bulkDeleteQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const { questionIds } = req.body as { questionIds: string[] };

    if (!questionIds || questionIds.length === 0) {
      throw new AppError(400, 'No question IDs provided');
    }

    const questions = await Question.find({ _id: { $in: questionIds } });
    const subjectIds = [...new Set(questions.map((q) => q.subjectId.toString()))];
    const subjects = await Subject.find({ _id: { $in: subjectIds } });
    const unauthorized = subjects.some((s) => s.ownerId.toString() !== req.user!.userId);

    if (unauthorized) {
      throw new AppError(403, 'Cannot delete questions you do not own');
    }

    await Question.deleteMany({ _id: { $in: questionIds } });
    logger.info({ userId: req.user.userId, count: questionIds.length }, 'Questions bulk deleted');
    res.json({ message: `${questionIds.length} questions deleted successfully` });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Bulk delete error');
    throw new AppError(500, 'Failed to delete questions');
  }
};


