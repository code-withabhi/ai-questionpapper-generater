import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createTopic,
  getTopicsByChapter,
  getTopicById,
  updateTopic,
  deleteTopic,
} from '../controllers/topic.controller.js';

const router = Router();

router.use(authenticate);

router.post('/', createTopic);
router.get('/chapter/:chapterId', getTopicsByChapter);
router.get('/:id', getTopicById);
router.put('/:id', updateTopic);
router.delete('/:id', deleteTopic);

export default router;
