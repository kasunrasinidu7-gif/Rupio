import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { updateAmount } from '../api/rupioApi.js';
import LoadingScreen from '../components/LoadingScreen.jsx';
import PaymentStatus from '../components/PaymentStatus.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { useCheckout } from '../context/CheckoutContext.jsx';

export default function AmountPage() {
  const { session, loading, error: sessionError, refresh } = useCheckout();
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const usesWholeUnits = session?.currency === 'LKR';

  useEffect(() => {
    if (session) {
      if (location.state?.restoreAmount) {
        const initialAmount = usesWholeUnits ? Math.round(Number(session.amount)) : session.amount;
        setAmount(String(initialAmount));
      } else {
        setAmount('');
      }
    }
  }, [session?.sessionId, session?.amount, session?.currency, usesWholeUnits, location.state?.restoreAmount]);

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
      navigate('/checkout/' + sessionId + '/confirm');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
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
    <section className="amount-entry-panel">
      <form onSubmit={continueToCard} className="form-stack amount-entry-form">
        <div className="amount-entry-heading">
          <label className="field-label" htmlFor="amount">Amount</label>
        </div>
        <div className="amount-input-wrap">
          <input
            id="amount"
            name="amount"
            aria-label={'Amount in ' + session.currency}
            type={usesWholeUnits ? 'text' : 'number'}
            inputMode={usesWholeUnits ? 'numeric' : 'decimal'}
            min={usesWholeUnits ? '1' : '0.01'}
            max="1000000"
            step={usesWholeUnits ? '1' : '0.01'}
            placeholder="Enter amount"
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
        </div>
        <p className="amount-entry-help">Add money to your VPay card in whole rupees.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <PrimaryButton className="amount-pay-button" type="submit" disabled={busy || session.status !== 'PENDING'}>
          {busy ? 'Saving amount…' : 'Continue to Rupio'}
        </PrimaryButton>
      </form>
    </section>
  );
}
