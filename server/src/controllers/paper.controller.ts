import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { Paper } from '../models/Paper.js';
import { Subject } from '../models/Subject.js';
import { Question } from '../models/Question.js';
import { streamQuestionPaperPdf, streamAnswerKeyPdf } from '../services/pdf/pdfGenerator.js';
import { DSAPaperEngine } from '../services/dsa/paperEngine.js';
import { PaperConstraintValidator } from '../services/dsa/validator.js';
import { QuestionCandidate } from '../services/dsa/types.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

const createPaperSchema = z.object({
  title: z.string().min(2).max(200),
  subjectId: z.string().min(1),
  durationMinutes: z.number().int().min(10).max(360).default(60),
  targetTotalMarks: z.number().int().min(5).max(500).default(50),
  instructions: z.string().optional(),
  status: z.enum(['draft', 'finalized']).optional().default('draft'),
  sections: z.array(
    z.object({
      title: z.string().min(1),
      instructions: z.string().optional(),
      marksPerQuestion: z.number().int().min(1).default(1),
      questionIds: z.array(z.string()),
    })
  ).default([]),
});

export const getPapers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const { subjectId } = req.query;
    const filter: any = { ownerId: req.user.userId };
    if (subjectId) filter.subjectId = subjectId;

    const papers = await Paper.find(filter)
      .populate('subjectId', 'name code')
      .sort({ createdAt: -1 });

    res.json({ papers, data: papers });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Get papers error');
    throw new AppError(500, 'Failed to fetch papers');
  }
};

export const getPaperById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const paper = await Paper.findById(req.params.id)
      .populate('subjectId', 'name code')
      .populate({
        path: 'sections.questionIds',
        model: 'Question',
      });

    if (!paper) throw new AppError(404, 'Paper not found');
    if (paper.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Access denied');
    }

    res.json(paper);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Get paper by id error');
    throw new AppError(500, 'Failed to fetch paper');
  }
};

export const createPaper = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const data = createPaperSchema.parse(req.body);

    const subject = await Subject.findById(data.subjectId);
    if (!subject || (subject.ownerId.toString() !== req.user.userId && !subject.shared)) {
      throw new AppError(403, 'Subject access denied');
    }

    const paper = await Paper.create({
      ...data,
      ownerId: req.user.userId,
    });

    logger.info({ userId: req.user.userId, paperId: paper._id }, 'Paper created');
    res.status(201).json(paper);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Create paper error');
    throw new AppError(500, 'Failed to create paper');
  }
};

export const generatePaperWithDsa = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const {
      title,
      subjectId,
      durationMinutes = 60,
      targetTotalMarks = 50,
      instructions = 'All questions are compulsory.',
      sectionRules,
      difficultyQuota,
      requiredTopicIds,
    } = req.body;

    if (!title || !subjectId) {
      throw new AppError(400, 'Title and Subject are required');
    }

    const allQuestions = await Question.find({ subjectId, approvalStatus: 'approved' }).lean();
    if (allQuestions.length === 0) {
      res.status(400).json({
        message: 'No approved questions in question bank for this subject. Please add questions first.',
      });
      return;
    }

    const candidates: QuestionCandidate[] = allQuestions.map((q) => ({
      _id: q._id.toString(),
      questionText: q.questionText,
      questionType: q.questionType,
      difficulty: q.difficulty,
      marks: q.marks || 1,
      topicId: q.topicId?.toString(),
      chapterId: q.chapterId?.toString(),
      subjectId: q.subjectId.toString(),
      bloomLevel: q.bloomLevel,
      normalizedTextHash: q.normalizedTextHash,
    }));

    const engine = new DSAPaperEngine();
    const engineResult = engine.generate(candidates, {
      targetTotalMarks: Number(targetTotalMarks),
      durationMinutes: Number(durationMinutes),
      sectionRules,
      difficultyQuota,
      requiredTopicIds,
    });

    if (!engineResult.success) {
      res.status(400).json({
        message: engineResult.errorReason || 'Unable to satisfy constraints with current question inventory.',
        validationReport: engineResult.validationReport,
        algorithmSummary: engineResult.algorithmSummary,
      });
      return;
    }

    const paper = await Paper.create({
      title,
      subjectId,
      ownerId: req.user.userId,
      durationMinutes,
      targetTotalMarks,
      instructions,
      status: 'draft',
      version: 1,
      sections: engineResult.sections.map((s) => ({
        title: s.title,
        instructions: s.instructions,
        marksPerQuestion: s.marksPerQuestion,
        questionIds: s.questionIds,
      })),
    });

    const populated = await Paper.findById(paper._id)
      .populate('subjectId', 'name code')
      .populate({ path: 'sections.questionIds', model: 'Question' });

    res.status(201).json({
      ...(populated ? populated.toObject() : paper.toObject()),
      algorithmSummary: engineResult.algorithmSummary,
      validationReport: engineResult.validationReport,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    logger.error({ err: error }, 'Generate paper DSA error');
    res.status(500).json({ message: error.message || 'Failed to generate question paper' });
  }
};

export const validatePaper = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const paper = await Paper.findById(req.params.id).populate({
      path: 'sections.questionIds',
      model: 'Question',
    });

    if (!paper) throw new AppError(404, 'Paper not found');
    if (paper.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Access denied');
    }

    const allQuestions: QuestionCandidate[] = [];
    for (const sec of paper.sections) {
      for (const q of (sec.questionIds as any[])) {
        if (q && q._id) {
          allQuestions.push({
            _id: q._id.toString(),
            questionText: q.questionText,
            questionType: q.questionType,
            difficulty: q.difficulty,
            marks: q.marks || sec.marksPerQuestion || 1,
            topicId: q.topicId?.toString(),
            chapterId: q.chapterId?.toString(),
            subjectId: q.subjectId?.toString(),
            bloomLevel: q.bloomLevel,
            normalizedTextHash: q.normalizedTextHash,
          });
        }
      }
    }

    const report = PaperConstraintValidator.validate(allQuestions, {
      targetTotalMarks: paper.targetTotalMarks,
      durationMinutes: paper.durationMinutes,
    });

    res.json({ report });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    logger.error({ err: error }, 'Validate paper error');
    res.status(500).json({ message: 'Failed to validate paper' });
  }
};

export const finalizePaper = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const paper = await Paper.findById(req.params.id).populate({
      path: 'sections.questionIds',
      model: 'Question',
    });

    if (!paper) throw new AppError(404, 'Paper not found');
    if (paper.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Access denied');
    }

    // Save snapshot in versionHistory before finalizing
    paper.versionHistory.push({
      versionNumber: paper.version,
      title: paper.title,
      sections: paper.sections,
      totalMarks: paper.targetTotalMarks,
      savedAt: new Date(),
    });

    paper.status = 'finalized';
    paper.version = (paper.version || 1) + 1;
    await paper.save();

    res.json({ message: 'Paper finalized successfully', paper });
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    logger.error({ err: error }, 'Finalize paper error');
    res.status(500).json({ message: 'Failed to finalize paper' });
  }
};

export const updatePaper = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const paper = await Paper.findById(req.params.id);
    if (!paper) throw new AppError(404, 'Paper not found');
    if (paper.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Access denied');
    }

    const { title, durationMinutes, targetTotalMarks, instructions, status, sections } = req.body;
    if (title) paper.title = title;
    if (durationMinutes !== undefined) paper.durationMinutes = durationMinutes;
    if (targetTotalMarks !== undefined) paper.targetTotalMarks = targetTotalMarks;
    if (instructions !== undefined) paper.instructions = instructions;
    if (status) paper.status = status;
    if (sections) paper.sections = sections;

    await paper.save();
    res.json(paper);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Update paper error');
    throw new AppError(500, 'Failed to update paper');
  }
};

export const deletePaper = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const paper = await Paper.findById(req.params.id);
    if (!paper) throw new AppError(404, 'Paper not found');
    if (paper.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Access denied');
    }

    await paper.deleteOne();
    res.json({ message: 'Paper deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Delete paper error');
    throw new AppError(500, 'Failed to delete paper');
  }
};

export const exportPaperPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const paper = await Paper.findById(req.params.id)
      .populate('subjectId', 'name code')
      .populate({ path: 'sections.questionIds', model: 'Question' });

    if (!paper) throw new AppError(404, 'Paper not found');
    if (paper.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Access denied');
    }

    streamQuestionPaperPdf(paper, res);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Export PDF error');
    throw new AppError(500, 'Failed to export paper PDF');
  }
};

export const exportAnswerKeyPdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const paper = await Paper.findById(req.params.id)
      .populate('subjectId', 'name code')
      .populate({ path: 'sections.questionIds', model: 'Question' });

    if (!paper) throw new AppError(404, 'Paper not found');
    if (paper.ownerId.toString() !== req.user.userId) {
      throw new AppError(403, 'Access denied');
    }

    streamAnswerKeyPdf(paper, res);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error({ err: error }, 'Export answer key error');
    throw new AppError(500, 'Failed to export answer key PDF');
  }
};

