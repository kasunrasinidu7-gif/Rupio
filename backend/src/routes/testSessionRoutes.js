import { Router } from 'express';
import { createTestCheckoutSession } from '../controllers/sessionController.js';
import { receiveTestCallback } from '../controllers/testController.js';
import { requireTestPageEnabled } from '../middleware/testPageMiddleware.js';

const router = Router();

router.post('/sessions', requireTestPageEnabled, createTestCheckoutSession);
router.post('/callback', requireTestPageEnabled, receiveTestCallback);

export default router;
