import { httpError } from './errors.js';

export function isValidTestOtp(value) {
  return String(value || '') === '000000';
}

export function getTestCardOutcome(cardNumber, expiry, cvv) {
  const digits = String(cardNumber || '').replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) throw httpError(400, 'Enter a valid test card number.');
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(expiry || ''))) {
    throw httpError(400, 'Enter the expiry as MM/YY.');
  }
  const [monthText, yearText] = expiry.split('/');
  const month = Number(monthText);
  const year = 2000 + Number(yearText);
  const lastDay = new Date(year, month, 0);
  if (lastDay < new Date(new Date().getFullYear(), new Date().getMonth(), 1)) {
    throw httpError(400, 'The test card expiry must be in the future.');
  }
  if (!/^\d{3,4}$/.test(String(cvv || ''))) throw httpError(400, 'Enter a three- or four-digit test CVV.');

  if (digits === '4242424242424242') {
    return { status: 'SUCCESS', message: 'Test payment approved.' };
  }
  if (digits === '4000000000000003') {
    return { status: 'TIMEOUT', message: 'The simulated payment processor timed out.' };
  }
  if (digits === '4000000000000002') {
    return { status: 'FAILED', message: 'The test card was declined.' };
  }
  throw httpError(400, 'Use one of the displayed demo cards. Real payment cards are not accepted.');
}
