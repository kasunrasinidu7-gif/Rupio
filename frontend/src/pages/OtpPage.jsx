import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { processPayment } from '../api/rupioApi.js';
import LoadingScreen from '../components/LoadingScreen.jsx';
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

  useEffect(() => {
    if (session?.status !== 'PENDING' && session?.paymentId) {
      navigate('/result/' + session.paymentId, { replace: true });
    }
  }, [navigate, session?.paymentId, session?.status]);

  if (loading) return <LoadingScreen message="Preparing verification…" />;
  if (sessionError) return <div className="panel error-panel" role="alert">{sessionError}</div>;
  if (!session) return null;
  if (session.status !== 'PENDING' && session.paymentId) {
    return <LoadingScreen message="Loading your payment result..." />;
  }
  if (busy) return <LoadingScreen message="Processing your payment..." />;
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
      <div className="card-payment-title otp-title">
        <h1>Enter OTP</h1>
      </div>
      <p className="otp-instruction">Rupio sent a 6-digit verification code to confirm this payment.</p>
      <form className="form-stack otp-form" onSubmit={confirmOtp}>
        <div className="otp-code-input" aria-label="Verification code">
        <input
          className="otp-accessible-input"
          id="otp"
          aria-label="Six-digit verification code"
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength="6"
          pattern="[0-9]{6}"
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
          required
        />
          <div className="otp-digit-row" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <span className={index === Math.min(otp.length, 5) ? 'otp-digit active' : 'otp-digit'} key={index}>{otp[index] || ''}</span>
            ))}
          </div>
        </div>
        <button className="resend-otp-button" type="button">Resend OTP</button>
        {error && <p className="form-error" role="alert">{error}</p>}
        <PrimaryButton className="otp-submit-button" type="submit" disabled={busy || session.status !== 'PENDING'}>
          {busy ? 'Confirming…' : 'Confirm'}
        </PrimaryButton>
        <button className="cancel-button otp-cancel-button" type="button" onClick={cancelCheckout} disabled={busy}>
          Cancel payment
        </button>
      </form>
    </section>
  );
}
