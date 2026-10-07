import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { processPayment } from '../api/rupioApi.js';
import { CheckoutProvider, useCheckout } from '../context/CheckoutContext.jsx';
import useCountdown from '../hooks/useCountdown.js';
import BrandHeader from './BrandHeader.jsx';

function CheckoutFrame() {
  const { session, loading } = useCheckout();
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isStep = /\/(?:mockpay\/)?checkout\/[^/]+(?:\/(?:card|otp))?$/.test(location.pathname);
  const timerActive = !loading && session?.status === 'PENDING' && isStep;
  const countdown = useCountdown(location.pathname, timerActive);
  const timeoutStarted = useRef(false);
  const [timeoutError, setTimeoutError] = useState('');

  useEffect(() => {
    timeoutStarted.current = false;
    setTimeoutError('');
  }, [location.pathname]);

  useEffect(() => {
    if (!timerActive || countdown.seconds > 0 || timeoutStarted.current) return;
    timeoutStarted.current = true;
    processPayment({ sessionId, action: 'timeout' })
      .then((result) => navigate('/result/' + result.payment.paymentId, { replace: true }))
      .catch((error) => {
        setTimeoutError(error.message || 'Could not record the checkout timeout.');
        timeoutStarted.current = false;
      });
  }, [countdown.seconds, navigate, sessionId, timerActive]);

  return (
    <div className="app-shell">
      <BrandHeader />
      <main className="checkout-wrap">
        <div className="secure-row">
          <span>Secure test checkout</span>
          {session?.status === 'PENDING' && (
            <span className={countdown.seconds < 30 ? 'timer timer-warning' : 'timer'}>
              Step time left {countdown.label}
            </span>
          )}
        </div>
        {timeoutError && <p className="form-error" role="alert">{timeoutError}</p>}
        <Outlet />
        <p className="footer-note">Rupio is a simulated gateway. No real money is charged.</p>
      </main>
      {loading && <span className="visually-hidden" role="status">Loading checkout</span>}
    </div>
  );
}

export default function CheckoutLayout() {
  const { sessionId } = useParams();
  return (
    <CheckoutProvider sessionId={sessionId}>
      <CheckoutFrame />
    </CheckoutProvider>
  );
}
