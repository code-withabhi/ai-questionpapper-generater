import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { Subject } from '../models/Subject.js';
import { Topic } from '../models/Topic.js';
import { Question } from '../models/Question.js';
import { generateHash } from '../utils/helpers.js';
import { generateQuestionsWithGemini } from '../services/ai/geminiQuestionGenerator.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import { toServerQuestionType } from './question.controller.js';

const generateSchema = z.object({
  subjectId: z.string().min(1),
  chapterId: z.string().min(1),
  topicId: z.string().min(1),
  questionType: z.enum(['multiple-choice', 'true-false', 'short-answer', 'essay']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  marks: z.number().int().min(1).max(100),
  count: z.number().int().min(1).max(10).default(3),
  bloomLevel: z.string().optional(),
});

export const generateQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const data = generateSchema.parse(req.body);

    const subject = await Subject.findById(data.subjectId);
    if (!subject || (subject.ownerId.toString() !== req.user.userId && !subject.shared)) {
      throw new AppError(403, 'Subject access denied');
    }

    const topic = await Topic.findById(data.topicId);
    if (!topic) throw new AppError(404, 'Topic not found');

    const questions = await generateQuestionsWithGemini({
      subjectName: subject.name,
      topicTitle: topic.title,
      topicDescription: topic.description,
      questionType: data.questionType,
      difficulty: data.difficulty,
      marks: data.marks,
      count: data.count,
      bloomLevel: data.bloomLevel,
    });

    res.json({ questions, count: questions.length });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    logger.error({ err: error }, 'AI Generate Controller Error');
    res.status(500).json({ message: error.message || 'AI Question Generation failed' });
  }
};

export const saveAiQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');

    const { subjectId, chapterId, topicId, questions } = req.body;
    if (!subjectId || !chapterId || !topicId || !Array.isArray(questions) || questions.length === 0) {
      throw new AppError(400, 'Invalid request payload');
    }

    const subject = await Subject.findById(subjectId);
    if (!subject || subject.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Subject access denied');
    }

    const saved = [];
    for (const q of questions) {
      const text = q.questionText || q.text;
      if (!text) continue;

      let options: Array<{ text: string; isCorrect: boolean }> = Array.isArray(q.options)
        ? q.options.map((opt: any) =>
            typeof opt === 'string'
              ? { text: opt, isCorrect: false }
              : { text: opt?.text || opt?.title || '', isCorrect: Boolean(opt?.isCorrect) }
          )
        : [];

      const rawType = q.questionType || q.type || 'short-answer';
      let serverType = toServerQuestionType(rawType, options);

      // Ensure valid options for true-false
      if (serverType === 'true-false' && options.length < 2) {
        const isTrue = String(q.correctAnswer || '').trim().toLowerCase() === 'true';
        options = [
          { text: 'True', isCorrect: isTrue },
          { text: 'False', isCorrect: !isTrue },
        ];
      }

      // Ensure valid options for MCQ
      if (serverType === 'mcq-single' || serverType === 'mcq-multiple') {
        if (options.length > 0 && !options.some((o: { text: string; isCorrect: boolean }) => o.isCorrect)) {
          const matchIdx = options.findIndex(
            (o: { text: string; isCorrect: boolean }) =>
              o.text.trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase()
          );
          if (matchIdx >= 0 && options[matchIdx]) {
            options[matchIdx].isCorrect = true;
          } else if (options[0]) {
            options[0].isCorrect = true;
          }
        }
        const correctCount = options.filter((o: { text: string; isCorrect: boolean }) => o.isCorrect).length;
        serverType = correctCount > 1 ? 'mcq-multiple' : 'mcq-single';
      }

      const created = await Question.create({
        subjectId,
        chapterId,
        topicId,
        ownerId: req.user.userId,
        questionText: text,
        questionType: serverType,
        difficulty: q.difficulty || 'medium',
        marks: q.marks || 1,
        bloomLevel: q.bloomLevel || 'apply',
        options,
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
        markingScheme: q.markingScheme || '',
        tags: q.tags || [],
        origin: 'ai-generated',
        approvalStatus: 'approved',
        normalizedTextHash: generateHash(text),
      });
      saved.push(created);
    }

    res.status(201).json({ savedCount: saved.length, questions: saved });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    logger.error({ err: error }, 'Save AI Questions Error');
    res.status(500).json({ message: error.message || 'Failed to save questions' });
  }
};
