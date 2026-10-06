import { Router } from 'express';
import { changeCheckoutAmount, createCheckoutSession, getCheckoutSession } from '../controllers/sessionController.js';
import { requireRupioApiKey } from '../middleware/apiKeyMiddleware.js';

const router = Router();

router.post('/', requireRupioApiKey, createCheckoutSession);
router.get('/:sessionId', getCheckoutSession);
router.patch('/:sessionId/amount', changeCheckoutAmount);

export default router;
