import { userMessage } from '../utils/userMessage.js';

const configuredApiOrigin = (import.meta.env.VITE_RUPIO_API_URL || '').replace(/\/+$/, '');
const apiBase = configuredApiOrigin ? configuredApiOrigin + '/api/v1' : '/api/v1';

async function request(path, options = {}) {
  if (import.meta.env.PROD && !configuredApiOrigin) {
    throw new Error('The payment service is unavailable. Please try again later.');
  }

  let response;
  try {
    response = await fetch(apiBase + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error(userMessage('network connection failed'));
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(userMessage(data.error, response.status));
  }
  return data;
}

export const getSession = (sessionId) =>
  request('/sessions/' + encodeURIComponent(sessionId));

export const createTestSession = (payload) =>
  request('/test/sessions', { method: 'POST', body: JSON.stringify(payload) });

export const retryCheckoutSession = (sessionId) =>
  request('/sessions/' + encodeURIComponent(sessionId) + '/retry', { method: 'POST' });

export const updateAmount = (sessionId, amount) =>
  request('/sessions/' + encodeURIComponent(sessionId) + '/amount', {
    method: 'PATCH',
    body: JSON.stringify({ amount })
  });

export const processPayment = (payload) =>
  request('/process', { method: 'POST', body: JSON.stringify(payload) });

export const getPayment = (paymentId) =>
  request('/payments/' + encodeURIComponent(paymentId));