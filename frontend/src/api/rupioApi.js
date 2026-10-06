async function request(path, options = {}) {
  const response = await fetch('/api/v1' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Rupio could not complete the request.');
  return data;
}

export const getSession = (sessionId) =>
  request('/sessions/' + encodeURIComponent(sessionId));

export const createTestSession = (payload) =>
  request('/test/sessions', { method: 'POST', body: JSON.stringify(payload) });

export const updateAmount = (sessionId, amount) =>
  request('/sessions/' + encodeURIComponent(sessionId) + '/amount', {
    method: 'PATCH',
    body: JSON.stringify({ amount })
  });

export const processPayment = (payload) =>
  request('/process', { method: 'POST', body: JSON.stringify(payload) });

export const getPayment = (paymentId) =>
  request('/payments/' + encodeURIComponent(paymentId));
