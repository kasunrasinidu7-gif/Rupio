import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { processPayment, updateAmount } from '../api/rupioApi.js';
import LoadingScreen from '../components/LoadingScreen.jsx';
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
  const usesWholeUnits = session?.currency === 'LKR';

  useEffect(() => {
    if (session) {
      const initialAmount = usesWholeUnits ? Math.round(Number(session.amount)) : session.amount;
      setAmount(String(initialAmount));
    }
  }, [session?.sessionId, session?.amount, session?.currency, usesWholeUnits]);

  async function continueToCard(event) {
    event.preventDefault();
    setError('');
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (numericAmount > 1000000) {
      setError('The maximum amount is 1,000,000.');
      return;
    }
    if (usesWholeUnits && !Number.isInteger(numericAmount)) {
      setError('Enter a whole amount in LKR; cents are not accepted.');
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

  if (loading) return <LoadingScreen message="Preparing your secure checkout…" />;
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

      <form onSubmit={continueToCard} className="form-stack">
        <label className="field-label" htmlFor="amount">Amount in {session.currency}</label>
        <div className="amount-input-wrap">
          <span>{session.currency}</span>
          <input
            id="amount"
            name="amount"
            type={usesWholeUnits ? 'text' : 'number'}
            inputMode={usesWholeUnits ? 'numeric' : 'decimal'}
            min={usesWholeUnits ? '1' : '0.01'}
            max="1000000"
            step={usesWholeUnits ? '1' : '0.01'}
            value={amount}
            onChange={(event) => {
              const nextAmount = event.target.value;
              if (usesWholeUnits && nextAmount !== '' && !/^\d+$/.test(nextAmount)) {
                setError('Enter a whole amount in LKR; cents are not accepted.');
                return;
              }
              setAmount(nextAmount);
              setError('');
            }}
            required
          />
          {usesWholeUnits && <span className="amount-fixed-decimals" aria-hidden="true">.00</span>}
        </div>
        <p className="field-hint">Final amount: {formatMoney(Number(amount), session.currency)}</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <PrimaryButton type="submit" disabled={busy || session.status !== 'PENDING'}>
          {busy ? 'Confirming…' : 'Confirm'}
        </PrimaryButton>
        <button className="cancel-button" type="button" onClick={cancelCheckout} disabled={busy}>
          Cancel payment
        </button>
      </form>
    </section>
  );
}
