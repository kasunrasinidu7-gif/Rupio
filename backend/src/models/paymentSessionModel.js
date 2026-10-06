import { randomUUID } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../config/firebase.js';
import { httpError } from '../utils/errors.js';

const sessions = db.collection('mockpaySessions');
const payments = db.collection('mockpayPayments');

function asIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

function serializeSession(data) {
  return {
    ...data,
    createdAt: asIso(data.createdAt),
    updatedAt: asIso(data.updatedAt),
    expiresAt: asIso(data.expiresAt),
    completedAt: asIso(data.completedAt),
    callbackAttemptedAt: asIso(data.callbackAttemptedAt),
    callbackDeliveredAt: asIso(data.callbackDeliveredAt)
  };
}

function serializePayment(data) {
  return { ...data, createdAt: asIso(data.createdAt) };
}

export async function createSession(input) {
  const sessionId = 'rupio_sess_' + randomUUID();
  const now = Timestamp.now();
  const ttlSeconds = Number(process.env.SESSION_TTL_SECONDS) || 120;
  const expiresAt = Timestamp.fromMillis(now.toMillis() + Math.max(30, Math.min(ttlSeconds, 600)) * 1000);
  const session = {
    sessionId,
    merchantReference: input.merchantReference,
    customerReference: input.customerReference || null,
    requestedAmount: input.amount,
    amount: input.amount,
    currency: input.currency,
    callbackUrl: input.callbackUrl,
    returnUrl: input.returnUrl,
    status: 'PENDING',
    paymentId: null,
    resultMessage: null,
    callbackDelivery: 'NOT_SENT',
    callbackAttempts: 0,
    createdAt: now,
    updatedAt: now,
    expiresAt
  };
  await sessions.doc(sessionId).create(session);
  return serializeSession(session);
}

export async function findSession(sessionId) {
  const snapshot = await sessions.doc(sessionId).get();
  return snapshot.exists ? serializeSession(snapshot.data()) : null;
}

export async function updateSessionAmount(sessionId, amount) {
  const reference = sessions.doc(sessionId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw httpError(404, 'Checkout session was not found.');
    const current = snapshot.data();
    if (current.status !== 'PENDING') throw httpError(409, 'This checkout session is already finished.');
    if (current.expiresAt.toMillis() <= Date.now()) {
      return { expired: true, session: serializeSession(current) };
    }
    const updated = { ...current, amount, updatedAt: Timestamp.now() };
    transaction.update(reference, { amount, updatedAt: updated.updatedAt });
    return { expired: false, session: serializeSession(updated) };
  });
}

export async function finalizeSession(sessionId, requestedResult) {
  const sessionReference = sessions.doc(sessionId);
  const paymentId = 'rupio_pay_' + randomUUID();
  const paymentReference = payments.doc(paymentId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(sessionReference);
    if (!snapshot.exists) throw httpError(404, 'Checkout session was not found.');
    const current = snapshot.data();

    if (current.status !== 'PENDING') {
      const existingPayment = current.paymentId
        ? await transaction.get(payments.doc(current.paymentId))
        : null;
      return {
        session: serializeSession(current),
        payment: existingPayment && existingPayment.exists ? serializePayment(existingPayment.data()) : null,
        created: false
      };
    }

    const expired = current.expiresAt.toMillis() <= Date.now();
    const status = expired ? 'TIMEOUT' : requestedResult.status;
    const amount = expired ? current.amount : (requestedResult.amount ?? current.amount);
    const message = expired
      ? 'The checkout session expired before payment was completed.'
      : requestedResult.message;
    const now = Timestamp.now();
    const payment = {
      paymentId,
      sessionId,
      merchantReference: current.merchantReference,
      requestedAmount: current.requestedAmount ?? current.amount,
      amount,
      currency: current.currency,
      status,
      message,
      callbackDelivery: 'PENDING',
      callbackAttempts: 0,
      createdAt: now
    };
    const updatedSession = {
      ...current,
      status,
      amount,
      paymentId,
      resultMessage: message,
      callbackDelivery: 'PENDING',
      completedAt: now,
      updatedAt: now
    };

    transaction.set(paymentReference, payment);
    transaction.update(sessionReference, {
      status,
      amount,
      paymentId,
      resultMessage: message,
      callbackDelivery: 'PENDING',
      completedAt: now,
      updatedAt: now
    });

    return {
      session: serializeSession(updatedSession),
      payment: serializePayment(payment),
      created: true
    };
  });
}

export async function findPayment(paymentId) {
  const snapshot = await payments.doc(paymentId).get();
  return snapshot.exists ? serializePayment(snapshot.data()) : null;
}

export async function updateCallbackDelivery(sessionId, paymentId, result) {
  const now = Timestamp.now();
  const update = {
    callbackDelivery: result.status,
    callbackAttempts: result.attempts,
    callbackMessage: result.message,
    callbackAttemptedAt: now
  };
  if (result.status === 'DELIVERED') update.callbackDeliveredAt = now;
  await Promise.all([
    sessions.doc(sessionId).update(update),
    payments.doc(paymentId).update(update)
  ]);
}
