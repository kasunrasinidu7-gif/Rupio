import { createHmac } from 'node:crypto';
import { updateCallbackDelivery } from '../models/paymentSessionModel.js';

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function sendMerchantCallback(session, payment) {
  const secret = process.env.RUPIO_CALLBACK_SECRET;
  if (!secret) return { status: 'FAILED', attempts: 0, message: 'Callback secret is not configured.' };

  const payload = {
    eventId: payment.paymentId,
    sessionId: session.sessionId,
    paymentId: payment.paymentId,
    merchantReference: session.merchantReference,
    requestedAmount: session.requestedAmount,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    message: payment.message,
    occurredAt: payment.createdAt
  };
  const body = JSON.stringify(payload);
  const digest = createHmac('sha256', secret).update(body).digest('hex');
  let lastMessage = 'Merchant callback could not be delivered.';

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(session.callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Rupio-Event-Id': payment.paymentId,
          'X-Rupio-Signature': 'sha256=' + digest
        },
        body,
        signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) throw new Error('Merchant application returned HTTP ' + response.status + '.');
      const result = { status: 'DELIVERED', attempts: attempt, message: 'Callback delivered.' };
      await updateCallbackDelivery(session.sessionId, payment.paymentId, result);
      return result;
    } catch (error) {
      lastMessage = error.message || lastMessage;
      if (attempt < 3) await wait(attempt * 300);
    }
  }

  const result = { status: 'FAILED', attempts: 3, message: lastMessage };
  await updateCallbackDelivery(session.sessionId, payment.paymentId, result);
  return result;
}
