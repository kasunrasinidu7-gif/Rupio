import test from 'node:test';
import assert from 'node:assert/strict';
import { isTestPageEnabled } from './testPageMiddleware.js';

test('test page is disabled by default and enabled only on staging in production', () => {
  const before = {
    enabled: process.env.RUPIO_TEST_PAGE_ENABLED,
    nodeEnv: process.env.NODE_ENV,
    rupioEnv: process.env.RUPIO_ENVIRONMENT
  };
  try {
    delete process.env.RUPIO_TEST_PAGE_ENABLED;
    process.env.NODE_ENV = 'development';
    assert.equal(isTestPageEnabled(), false);

    process.env.RUPIO_TEST_PAGE_ENABLED = 'true';
    process.env.NODE_ENV = 'production';
    process.env.RUPIO_ENVIRONMENT = 'production';
    assert.equal(isTestPageEnabled(), false);

    process.env.RUPIO_ENVIRONMENT = 'staging';
    assert.equal(isTestPageEnabled(), true);
  } finally {
    for (const [key, value] of Object.entries({
      RUPIO_TEST_PAGE_ENABLED: before.enabled,
      NODE_ENV: before.nodeEnv,
      RUPIO_ENVIRONMENT: before.rupioEnv
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
