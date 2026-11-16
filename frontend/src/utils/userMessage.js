export function userMessage(error, status) {
  const raw = typeof error === 'string' ? error : error?.message || '';
  const message = raw.toLowerCase();

  if (/otp|one-time password|verification code/.test(message)) {
    return 'Incorrect OTP. Please try again.';
  }
  if (/checkout session has expired|session has expired|checkout.*expired/.test(message)) {
    return 'This checkout has expired. Please start again.';
  }
  if (/expiry|expiration|expired card/.test(message)) {
    return 'Check your card expiry date.';
  }
  if (/cvv|cvn|security code/.test(message)) {
    return 'Check your card security code.';
  }
  if (/card number|demo card|test card/.test(message)) {
    return 'Check your card details and try again.';
  }
  if (/amount|rupees|lkr/.test(message)) {
    return 'Enter a valid amount and try again.';
  }
  if (/retri/.test(message)) {
    return 'This payment cannot be retried. Please start again from the app.';
  }
  if (/already finished|already completed/.test(message)) {
    return 'This checkout is already complete.';
  }
  if (/not found|invalid.*session|invalid.*payment/.test(message) || status === 404) {
    return 'Checkout could not be found. Return to the app and try again.';
  }
  if (/network|fetch|connect|unavailable|timeout/.test(message)) {
    return 'Could not connect. Check your internet and try again.';
  }
  if (status === 401 || status === 403) {
    return 'We could not verify this checkout. Return to the app and try again.';
  }
  if (status >= 500) {
    return 'We could not complete this payment. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}