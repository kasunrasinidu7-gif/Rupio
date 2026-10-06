import { createHmac, timingSafeEqual } from 'node:crypto';
import { httpError } from '../utils/errors.js';

export function receiveTestCallback(request, response) {
  const secret = process.env.RUPIO_CALLBACK_SECRET;
  if (!secret) throw httpError(503, 'Rupio callback signing is not configured.');

  const signature = request.get('X-Rupio-Signature') || '';
  const body = JSON.stringify(request.body || {});
  const digest = createHmac('sha256', secret).update(body).digest('hex');
  const expected = 'sha256=' + digest;
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw httpError(401, 'Test callback signature is invalid.');
  }

  return response.status(200).json({ received: true });
}
