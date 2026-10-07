import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { processPayment } from '../api/rupioApi.js';
import AmountSummary from '../components/AmountSummary.jsx';
import PaymentStatus from '../components/PaymentStatus.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { useCheckout } from '../context/CheckoutContext.jsx';

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
}

export default function CardPage() {
  const { session, loading, error: sessionError } = useCheckout();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function continueToOtp(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    navigate('/checkout/' + sessionId + '/otp', {
      state: { cardDetails: { cardNumber, expiry, cvv } }
    });
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

  function useDemoCard(number) {
    setCardNumber(formatCardNumber(number));
    setExpiry('12/30');
    setCvv('123');
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
        <span className="step-number">02</span>
        <div>
          <p className="eyebrow">Test card</p>
          <h1>Card details</h1>
          <p className="muted">Enter demo card details. OTP confirmation is next.</p>
        </div>
      </div>
      <AmountSummary amount={session.amount} currency={session.currency} reference={session.merchantReference} compact />

      <form className="form-stack" onSubmit={continueToOtp}>
        <label className="field-label" htmlFor="card-number">Card number</label>
        <input
          className="text-input"
          id="card-number"
          autoComplete="cc-number"
          inputMode="numeric"
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
          required
        />
        <div className="field-row">
          <div>
            <label className="field-label" htmlFor="expiry">Expiry</label>
            <input
              className="text-input"
              id="expiry"
              autoComplete="cc-exp"
              inputMode="numeric"
              placeholder="MM/YY"
              maxLength="5"
              value={expiry}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
                setExpiry(digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits);
              }}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="cvv">CVV</label>
            <input
              className="text-input"
              id="cvv"
              autoComplete="cc-csc"
              inputMode="numeric"
              maxLength="4"
              placeholder="123"
              value={cvv}
              onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>
        </div>

        <details className="demo-cards">
          <summary>Show demo card outcomes</summary>
          <button type="button" onClick={() => useDemoCard('4242424242424242')}>
            <span>Success</span><code>4242 4242 4242 4242</code>
          </button>
          <button type="button" onClick={() => useDemoCard('4000000000000002')}>
            <span>Declined</span><code>4000 0000 0000 0002</code>
          </button>
          <button type="button" onClick={() => useDemoCard('4000000000000003')}>
            <span>Timeout</span><code>4000 0000 0000 0003</code>
          </button>
        </details>

        {error && <p className="form-error" role="alert">{error}</p>}
        <PrimaryButton type="submit" disabled={busy || session.status !== 'PENDING'}>
          {busy ? 'Please wait…' : 'Continue to OTP'}
          <span aria-hidden="true">→</span>
        </PrimaryButton>
        <button className="cancel-button" type="button" onClick={cancelCheckout} disabled={busy}>
          Cancel payment
        </button>
      </form>
    </section>
  );
}
