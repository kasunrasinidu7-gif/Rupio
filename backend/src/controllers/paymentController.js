import { findPayment, findSession, finalizeSession } from '../models/paymentSessionModel.js';
import { sendMerchantCallback } from '../utils/callback.js';
import { httpError } from '../utils/errors.js';
import { parseAmount } from '../utils/validation.js';

function publicPayment(payment, session) {
  return {
    paymentId: payment.paymentId,
    sessionId: payment.sessionId,
    merchantReference: payment.merchantReference,
    requestedAmount: payment.requestedAmount,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    message: payment.message,
    callbackDelivery: payment.callbackDelivery,
    callbackMessage: payment.callbackMessage || null,
    createdAt: payment.createdAt,
    returnUrl: session?.returnUrl || null
  };
}

function cardOutcome(cardNumber, expiry, cvv) {
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

async function completeAndNotify(session, result) {
  const finalized = await finalizeSession(session.sessionId, result);
  let callback = null;
  if (finalized.created) callback = await sendMerchantCallback(finalized.session, finalized.payment);
  const latestPayment = await findPayment(finalized.session.paymentId);
  return {
    payment: latestPayment || finalized.payment,
    session: finalized.session,
    callback
  };
}

export async function processPayment(request, response) {
  const body = request.body || {};
  const sessionId = String(body.sessionId || '');
  if (!/^(?:rupio_sess_|mp_sess_)[0-9a-f-]{36}$/i.test(sessionId)) {
    throw httpError(400, 'A valid Rupio sessionId is required.');
  }
  const session = await findSession(sessionId);
  if (!session) throw httpError(404, 'Checkout session was not found.');

  if (session.status !== 'PENDING') {
    const payment = session.paymentId ? await findPayment(session.paymentId) : null;
    if (!payment) throw httpError(409, 'This checkout session is already finished.');
    return response.json({ payment: publicPayment(payment, session) });
  }

  let result;
  if (Date.parse(session.expiresAt) <= Date.now()) {
    result = { status: 'TIMEOUT', message: 'The checkout session expired before payment was completed.' };
  } else if (body.action === 'timeout') {
    result = { status: 'TIMEOUT', amount: session.amount, message: 'The two-minute time limit for this checkout step expired.' };
  } else if (body.action === 'cancel') {
    result = { status: 'CANCELLED', amount: session.amount, message: 'The customer cancelled the checkout.' };
  } else if (body.action === 'pay') {
    if (String(body.otp || '') !== '0000') {
      throw httpError(400, 'Incorrect test OTP. Enter 0000 to confirm.');
    }
    result = {
      ...cardOutcome(body.cardNumber, body.expiry, body.cvv),
      amount: parseAmount(body.amount)
    };
  } else {
    throw httpError(400, 'action must be pay, cancel, or timeout.');
  }

  const completed = await completeAndNotify(session, result);
  return response.json({
    payment: publicPayment(completed.payment, completed.session),
    callback: completed.callback ? {
      status: completed.callback.status,
      message: completed.callback.message
    } : undefined
  });
}

export async function getPaymentStatus(request, response) {
  const payment = await findPayment(request.params.paymentId);
  if (!payment) throw httpError(404, 'Payment was not found.');
  const session = await findSession(payment.sessionId);
  return response.json({ payment: publicPayment(payment, session) });
}
