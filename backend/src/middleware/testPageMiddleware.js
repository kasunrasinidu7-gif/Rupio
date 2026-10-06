import { httpError } from '../utils/errors.js';

export function requireTestPageEnabled(request, response, next) {
  if (process.env.RUPIO_TEST_PAGE_ENABLED !== 'true' || process.env.NODE_ENV === 'production') {
    return next(httpError(404, 'Route was not found.'));
  }
  return next();
}
