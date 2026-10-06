import { timingSafeEqual } from 'node:crypto';
import { httpError } from '../utils/errors.js';

export function requireRupioApiKey(request, response, next) {
  const expected = process.env.RUPIO_API_KEY || '';
  const provided = request.get('X-API-Key') || '';
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  const valid = expectedBuffer.length > 0
    && expectedBuffer.length === providedBuffer.length
    && timingSafeEqual(expectedBuffer, providedBuffer);

  if (!valid) return next(httpError(401, 'A valid Rupio integration API key is required.'));
  return next();
}
