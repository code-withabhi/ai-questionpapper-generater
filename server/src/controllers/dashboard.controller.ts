import { Response } from 'express';
import { Subject } from '../models/Subject.js';
import { Chapter } from '../models/Chapter.js';
import { Topic } from '../models/Topic.js';
import { Question } from '../models/Question.js';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { logger } from '../utils/logger.js';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const userId = req.user.userId;

    // Get user's subjects
    const userSubjects = await Subject.find({ ownerId: userId }).select('_id');
    const subjectIds = userSubjects.map((s) => s._id);

    // Aggregate stats
    const [
      subjectCount,
      chapterCount,
      topicCount,
      questionCount,
      questionsByDifficulty,
      questionsByType,
      recentQuestions,
    ] = await Promise.all([
      Subject.countDocuments({ ownerId: userId }),
      Chapter.countDocuments({ subjectId: { $in: subjectIds } }),
      Topic.countDocuments({ subjectId: { $in: subjectIds } }),
      Question.countDocuments({ subjectId: { $in: subjectIds } }),
      Question.aggregate([
        { $match: { subjectId: { $in: subjectIds } } },
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),
      Question.aggregate([
        { $match: { subjectId: { $in: subjectIds } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Question.find({ subjectId: { $in: subjectIds } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('subjectId', 'name code')
        .populate('topicId', 'title')
        .lean(),
    ]);

    const stats = {
      subjects: subjectCount,
      chapters: chapterCount,
      topics: topicCount,
      questions: questionCount,
      questionsByDifficulty: questionsByDifficulty.reduce(
        (acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        },
        {} as Record<string, number>
      ),
      questionsByType: questionsByType.reduce(
        (acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentQuestions,
    };

    res.json(stats);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Dashboard stats error');
    throw new AppError(500, 'Failed to fetch dashboard stats');
  }
};
