import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
} from '../controllers/subject.controller.js';

const router = Router();

// All subject routes require authentication
router.use(authenticate);

router.post('/', createSubject);
router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

export default router;
