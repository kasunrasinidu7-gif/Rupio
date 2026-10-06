import { Router } from 'express';
import { getPaymentStatus, processPayment } from '../controllers/paymentController.js';

const router = Router();

router.post('/process', processPayment);
router.get('/payments/:paymentId', getPaymentStatus);

export default router;
