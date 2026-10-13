import { Router } from 'express';
import { generateQuestions, saveAiQuestions } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

router.post('/generate-questions', aiLimiter, generateQuestions);
router.post('/save-questions', saveAiQuestions);

export default router;
