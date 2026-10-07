import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { processPayment } from '../api/rupioApi.js';
import AmountSummary from '../components/AmountSummary.jsx';
import PaymentStatus from '../components/PaymentStatus.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';
import { useCheckout } from '../context/CheckoutContext.jsx';

export default function OtpPage() {
  const { session, loading, error: sessionError } = useCheckout();
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cardDetails = location.state?.cardDetails;
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function confirmOtp(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await processPayment({
        sessionId,
        action: 'pay',
        amount: session.amount,
        ...cardDetails,
        otp
      });
      navigate('/result/' + result.payment.paymentId);
    } catch (requestError) {
      setError(requestError.message);
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
        <Link className="text-link" to={'/result/' + session.paymentId}>View payment result</Link>
      </div>
    );
  }
  if (!cardDetails) {
    return (
      <section className="panel">
        <h1>Card details needed</h1>
        <p className="muted">Enter the test card details before confirming the OTP.</p>
        <Link className="primary-button button-link" to={'/checkout/' + sessionId + '/card'}>Back to card details <span aria-hidden="true">→</span></Link>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="step-heading">
        <span className="step-number">03</span>
        <div>
          <p className="eyebrow">Test verification</p>
          <h1>Confirm with OTP</h1>
          <p className="muted">Enter the test OTP <strong>0000</strong> to continue.</p>
        </div>
      </div>
      <AmountSummary amount={session.amount} currency={session.currency} reference={session.merchantReference} compact />
      <form className="form-stack" onSubmit={confirmOtp}>
        <label className="field-label" htmlFor="otp">One-time password</label>
        <input
          className="text-input"
          id="otp"
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength="4"
          placeholder="0000"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
          required
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <PrimaryButton type="submit" disabled={busy || session.status !== 'PENDING'}>
          {busy ? 'Confirming…' : 'Confirm OTP'} <span aria-hidden="true">→</span>
        </PrimaryButton>
        <button className="cancel-button" type="button" onClick={cancelCheckout} disabled={busy}>
          Cancel payment
        </button>
      </form>
    </section>
  );
}
