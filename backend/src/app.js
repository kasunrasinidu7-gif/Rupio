import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { errorHandler } from './middleware/errorHandler.js';
import paymentRoutes from './routes/paymentRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import testSessionRoutes from './routes/testSessionRoutes.js';
import { isTestPageEnabled } from './middleware/testPageMiddleware.js';

const app = express();
const frontendDist = fileURLToPath(new URL('../../frontend/dist', import.meta.url));
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.disable('x-powered-by');
app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: '16kb' }));

app.get('/health', (request, response) => response.json({ status: 'ok', service: 'rupio' }));
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/test', testSessionRoutes);
app.use('/api/v1', paymentRoutes);
// Preserve the former endpoints while existing integrations migrate to Rupio's API.
app.use('/mockpay/api/sessions', sessionRoutes);
app.use('/mockpay/api', paymentRoutes);

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  const sendCheckoutApp = (request, response) => response.sendFile(path.join(frontendDist, 'index.html'));
  app.get('/checkout/:sessionId', sendCheckoutApp);
  if (isTestPageEnabled()) {
    app.get('/test', sendCheckoutApp);
  }
  app.get('/checkout/:sessionId/card', sendCheckoutApp);
  app.get('/result/:paymentId', sendCheckoutApp);
  app.get('/mockpay/checkout/:sessionId', sendCheckoutApp);
  app.get('/mockpay/checkout/:sessionId/card', sendCheckoutApp);
  app.get('/mockpay/result/:paymentId', sendCheckoutApp);
}

app.use((request, response) => response.status(404).json({ error: 'Route was not found.' }));
app.use(errorHandler);

export default app;
