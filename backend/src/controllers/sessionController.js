import { createSession, findSession, finalizeSession, updateSessionAmount } from '../models/paymentSessionModel.js';
import { sendIntegrationCallback } from '../utils/callback.js';
import { httpError } from '../utils/errors.js';
import { parseAmount, parseCallbackUrl, parseCurrency, parseReturnUrl } from '../utils/validation.js';

function publicSession(session) {
  return {
    sessionId: session.sessionId,
    clientReference: session.clientReference,
    requestedAmount: session.requestedAmount,
    amount: session.amount,
    currency: session.currency,
    status: session.status,
    paymentId: session.paymentId,
    resultMessage: session.resultMessage,
    returnUrl: session.returnUrl,
    callbackDelivery: session.callbackDelivery,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt
  };
}

async function expireIfNeeded(session) {
  if (session.status !== 'PENDING' || Date.parse(session.expiresAt) > Date.now()) return session;
  const result = await finalizeSession(session.sessionId, {
    status: 'TIMEOUT',
    message: 'The checkout session expired before payment was completed.'
  });
  if (result.created) await sendIntegrationCallback(result.session, result.payment);
  return result.session;
}

async function buildCheckoutSession(body) {
  if (!process.env.RUPIO_CALLBACK_SECRET) {
    throw httpError(503, 'Rupio callback signing is not configured.');
  }
  const clientReference = String(body.clientReference || '').trim();
  if (!clientReference || clientReference.length > 100) {
    throw httpError(400, 'clientReference is required and must be 100 characters or fewer.');
  }
  const currency = parseCurrency(body.currency);

  const session = await createSession({
    clientReference,
    customerReference: body.customerReference ? String(body.customerReference).slice(0, 120) : null,
    amount: parseAmount(body.amount, currency),
    currency,
    callbackUrl: parseCallbackUrl(body.callbackUrl),
    returnUrl: parseReturnUrl(body.returnUrl)
  });
  const baseUrl = (process.env.RUPIO_PUBLIC_URL || 'http://localhost:5173').replace(/\/+$/, '');

  return {
    sessionId: session.sessionId,
    checkoutUrl: baseUrl + '/checkout/' + session.sessionId,
    expiresAt: session.expiresAt
  };
}

export async function createCheckoutSession(request, response) {
  const result = await buildCheckoutSession(request.body || {});
  return response.status(201).json(result);
}

export async function createTestCheckoutSession(request, response) {
  const port = Number(process.env.PORT) || 3001;
  const result = await buildCheckoutSession({
    ...(request.body || {}),
    callbackUrl: 'http://127.0.0.1:' + port + '/api/v1/test/callback'
  });
  return response.status(201).json(result);
}

export async function getCheckoutSession(request, response) {
  const session = await findSession(request.params.sessionId);
  if (!session) throw httpError(404, 'Checkout session was not found.');
  const current = await expireIfNeeded(session);
  return response.json({ session: publicSession(current) });
}

export async function changeCheckoutAmount(request, response) {
  const currentSession = await findSession(request.params.sessionId);
  if (!currentSession) throw httpError(404, 'Checkout session was not found.');
  const amount = parseAmount(request.body?.amount, currentSession.currency);
  const updated = await updateSessionAmount(request.params.sessionId, amount);
  if (updated.expired) {
    const result = await finalizeSession(request.params.sessionId, {
      status: 'TIMEOUT',
      message: 'The checkout session expired before payment was completed.'
    });
    if (result.created) await sendIntegrationCallback(result.session, result.payment);
    return response.status(410).json({ error: 'This checkout session has expired.', session: publicSession(result.session) });
  }
  return response.json({ session: publicSession(updated.session) });
}
