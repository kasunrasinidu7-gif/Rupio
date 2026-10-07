import { httpError } from './errors.js';

export function parseAmount(value, currency = 'LKR') {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
    throw httpError(400, 'Enter an amount greater than zero and no more than 1,000,000.');
  }

  const fractionDigits = currency === 'LKR' ? 0 : 2;
  const multiplier = 10 ** fractionDigits;
  const rounded = Math.round(amount * multiplier) / multiplier;
  if (Math.abs(amount - rounded) > 0.000001) {
    if (currency === 'LKR') {
      throw httpError(400, 'LKR amounts must be whole rupees; cents are not accepted.');
    }
    throw httpError(400, 'Amounts can have up to two decimal places.');
  }
  return rounded;
}

export function parseCallbackUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) {
    throw httpError(400, 'A valid callbackUrl is required.');
  }
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol');
    return url.toString();
  } catch {
    throw httpError(400, 'callbackUrl must be a valid HTTP or HTTPS URL.');
  }
}

export function parseReturnUrl(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2048) {
    throw httpError(400, 'returnUrl must be a valid URL.');
  }
  try {
    const url = new URL(value);
    if (!['http:', 'https:', 'vpay:'].includes(url.protocol)) throw new Error('protocol');
    return url.toString();
  } catch {
    throw httpError(400, 'returnUrl must use HTTP, HTTPS, or the vpay scheme.');
  }
}

export function parseCurrency(value) {
  const currency = String(value || 'LKR').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw httpError(400, 'currency must be a three-letter code.');
  return currency;
}
