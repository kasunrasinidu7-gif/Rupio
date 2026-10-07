import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, parseCallbackUrl, parseCurrency, parseReturnUrl } from './validation.js';

test('LKR accepts positive whole-rupee amounts only', () => {
  assert.equal(parseAmount('100', 'LKR'), 100);
  assert.throws(() => parseAmount('100.17', 'LKR'), /whole rupees/);
  assert.throws(() => parseAmount('0', 'LKR'), /greater than zero/);
  assert.throws(() => parseAmount('1000001', 'LKR'), /no more than 1,000,000/);
});

test('other currencies allow at most two decimal places', () => {
  assert.equal(parseAmount('12.34', 'USD'), 12.34);
  assert.throws(() => parseAmount('12.345', 'USD'), /two decimal places/);
});

test('callback and return URLs only allow supported schemes', () => {
  assert.equal(parseCallbackUrl('https://merchant.test/callback'), 'https://merchant.test/callback');
  assert.throws(() => parseCallbackUrl('file:///callback'), /HTTP or HTTPS/);
  assert.equal(parseReturnUrl('vpay://topup/result'), 'vpay://topup/result');
  assert.throws(() => parseReturnUrl('javascript:alert(1)'), /HTTP, HTTPS, or the vpay scheme/);
});

test('currency is normalized and must be a three-letter code', () => {
  assert.equal(parseCurrency('lkr'), 'LKR');
  assert.throws(() => parseCurrency('rupees'), /three-letter code/);
});
