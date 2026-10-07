import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { receiveTestCallback } from '../controllers/testController.js';

const secret = 'unit-test-callback-secret';

function makeResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('test callback accepts a valid HMAC signature', () => {
  const originalSecret = process.env.RUPIO_CALLBACK_SECRET;
  process.env.RUPIO_CALLBACK_SECRET = secret;
  try {
    const body = { eventId: 'evt_1', status: 'SUCCESS', amount: 100 };
    const signature = 'sha256=' + createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
    const response = makeResponse();
    receiveTestCallback({ body, get: () => signature }, response);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { received: true });
  } finally {
    if (originalSecret === undefined) delete process.env.RUPIO_CALLBACK_SECRET;
    else process.env.RUPIO_CALLBACK_SECRET = originalSecret;
  }
});

test('test callback rejects an invalid HMAC signature', () => {
  const originalSecret = process.env.RUPIO_CALLBACK_SECRET;
  process.env.RUPIO_CALLBACK_SECRET = secret;
  try {
    assert.throws(
      () => receiveTestCallback({ body: { status: 'SUCCESS' }, get: () => 'sha256=invalid' }, makeResponse()),
      (error) => error.status === 401
    );
  } finally {
    if (originalSecret === undefined) delete process.env.RUPIO_CALLBACK_SECRET;
    else process.env.RUPIO_CALLBACK_SECRET = originalSecret;
  }
});
