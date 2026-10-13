import { Router } from 'express';
import {
  getPapers,
  getPaperById,
  createPaper,
  generatePaperWithDsa,
  updatePaper,
  deletePaper,
  exportPaperPdf,
  exportAnswerKeyPdf,
  validatePaper,
  finalizePaper,
} from '../controllers/paper.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getPapers);
router.post('/', createPaper);
router.post('/generate-dsa', generatePaperWithDsa);
router.get('/:id', getPaperById);
router.put('/:id', updatePaper);
router.delete('/:id', deletePaper);
router.get('/:id/validate', validatePaper);
router.post('/:id/finalize', finalizePaper);
router.get('/:id/export/pdf', exportPaperPdf);
router.get('/:id/export/answer-key', exportAnswerKeyPdf);

export default router;
