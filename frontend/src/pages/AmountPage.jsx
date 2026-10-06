import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { processPayment, updateAmount } from '../api/rupioApi.js';
import AmountSummary from '../components/AmountSummary.jsx';
import PaymentStatus from '../components/PaymentStatus.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { useCheckout } from '../context/CheckoutContext.jsx';
import { formatMoney } from '../utils/format.js';

export default function AmountPage() {
  const { session, loading, error: sessionError, refresh } = useCheckout();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) setAmount(String(session.amount));
  }, [session?.sessionId, session?.amount]);

  async function continueToCard(event) {
    event.preventDefault();
    setError('');
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    setBusy(true);
    try {
      await updateAmount(sessionId, numericAmount);
      await refresh();
      navigate('/checkout/' + sessionId + '/card');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancelCheckout() {
    setBusy(true);
    setError('');
    try {
      const result = await processPayment({ sessionId, action: 'cancel' });
      navigate('/result/' + result.payment.paymentId);
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  if (loading) return <div className="panel loading-panel">Loading your checkout…</div>;
  if (sessionError) return <div className="panel error-panel" role="alert">{sessionError}</div>;
  if (!session) return null;
  if (session.status !== 'PENDING' && session.paymentId) {
    return (
      <div className="panel">
        <PaymentStatus status={session.status} message={session.resultMessage} />
        <a className="text-link" href={'/result/' + session.paymentId}>View payment result</a>
      </div>
    );
  }

  return (
    <section className="panel">
      <div className="step-heading">
        <span className="step-number">01</span>
        <div>
          <p className="eyebrow">Payment amount</p>
          <h1>Enter your amount</h1>
          <p className="muted">You can edit the amount before continuing.</p>
        </div>
      </div>

      <AmountSummary amount={session.amount} currency={session.currency} reference={session.merchantReference} />

      <form onSubmit={continueToCard} className="form-stack">
        <label className="field-label" htmlFor="amount">Amount in {session.currency}</label>
        <div className="amount-input-wrap">
          <span>{session.currency}</span>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            max="1000000"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </div>
        <p className="field-hint">Final amount: {formatMoney(Number(amount), session.currency)}</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <PrimaryButton type="submit" disabled={busy || session.status !== 'PENDING'}>
          {busy ? 'Please wait…' : 'Continue to card'}
          <span aria-hidden="true">→</span>
        </PrimaryButton>
        <button className="cancel-button" type="button" onClick={cancelCheckout} disabled={busy}>
          Cancel payment
        </button>
      </form>
    </section>
  );
}
