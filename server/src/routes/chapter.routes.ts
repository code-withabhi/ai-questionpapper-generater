import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createChapter,
  getChaptersBySubject,
  getChapterById,
  updateChapter,
  deleteChapter,
  reorderChapters,
} from '../controllers/chapter.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createChapter);
router.get('/subject/:subjectId', getChaptersBySubject);
router.get('/:id', getChapterById);
router.put('/:id', updateChapter);
router.delete('/:id', deleteChapter);
router.post('/reorder', reorderChapters);

export default router;
