import { httpError } from '../utils/errors.js';

export function isTestPageEnabled() {
  if (process.env.RUPIO_TEST_PAGE_ENABLED !== 'true') return false;
  return process.env.NODE_ENV !== 'production' || process.env.RUPIO_ENVIRONMENT === 'staging';
}

export function requireTestPageEnabled(request, response, next) {
  if (!isTestPageEnabled()) {
    return next(httpError(404, 'Route was not found.'));
  }
  return next();
}
