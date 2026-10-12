import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  bulkDeleteQuestions,
} from '../controllers/question.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createQuestion);
router.get('/', getQuestions);
router.get('/:id', getQuestionById);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);
router.post('/bulk-delete', bulkDeleteQuestions);

export default router;
