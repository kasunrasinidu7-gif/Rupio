import test from 'node:test';
import assert from 'node:assert/strict';
import { getTestCardOutcome, isValidTestOtp } from './testPayment.js';

function futureExpiry() {
  const date = new Date();
  date.setMonth(date.getMonth() + 2);
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
}

test('six-zero test OTP is accepted; other values are rejected', () => {
  assert.equal(isValidTestOtp('000000'), true);
  assert.equal(isValidTestOtp('0000'), false);
  assert.equal(isValidTestOtp('123456'), false);
});

test('demo cards produce their documented outcomes', () => {
  const expiry = futureExpiry();
  assert.equal(getTestCardOutcome('4242 4242 4242 4242', expiry, '123').status, 'SUCCESS');
  assert.equal(getTestCardOutcome('4000 0000 0000 0002', expiry, '123').status, 'FAILED');
  assert.equal(getTestCardOutcome('4000 0000 0000 0003', expiry, '123').status, 'TIMEOUT');
});

test('invalid card inputs are rejected', () => {
  assert.throws(() => getTestCardOutcome('123', futureExpiry(), '123'), /valid test card number/);
  assert.throws(() => getTestCardOutcome('4242424242424242', '13/30', '123'), /MM\/YY/);
  assert.throws(() => getTestCardOutcome('4242424242424242', '01/20', '123'), /expiry must be in the future/);
  assert.throws(() => getTestCardOutcome('4242424242424242', futureExpiry(), '1'), /three- or four-digit/);
  assert.throws(() => getTestCardOutcome('4111111111111111', futureExpiry(), '123'), /demo cards/);
});
