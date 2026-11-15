import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { processPayment } from '../api/rupioApi.js';
import { CheckoutProvider, useCheckout } from '../context/CheckoutContext.jsx';
import useCountdown from '../hooks/useCountdown.js';
import AmountSummary from './AmountSummary.jsx';
import BrandHeader from './BrandHeader.jsx';
import LoadingScreen from './LoadingScreen.jsx';

function CheckoutFrame() {
  const { session, loading } = useCheckout();
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isStep = /\/(?:mockpay\/)?checkout\/[^/]+(?:\/(?:card|otp))?$/.test(location.pathname);
  const isAmountStep = /\/(?:mockpay\/)?checkout\/[^/]+$/.test(location.pathname);
  const isCardStep = /\/(?:mockpay\/)?checkout\/[^/]+\/card$/.test(location.pathname);
  const isOtpStep = /\/(?:mockpay\/)?checkout\/[^/]+\/otp$/.test(location.pathname);
  const timerActive = !loading && session?.status === 'PENDING' && isStep;
  const countdown = useCountdown(location.pathname, timerActive);
  const timeoutStarted = useRef(false);
  const previousPath = useRef(location.pathname);
  const [transitioning, setTransitioning] = useState(false);
  const [timeoutError, setTimeoutError] = useState('');

  useEffect(() => {
    if (previousPath.current === location.pathname) return undefined;
    previousPath.current = location.pathname;
    setTransitioning(true);
    const timer = window.setTimeout(() => setTransitioning(false), 450);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

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

  if (loading || transitioning) {
    return <LoadingScreen message={loading ? 'Preparing your secure checkout…' : 'Loading the next payment step…'} />;
  }

  return (
    <div className="app-shell">
      <BrandHeader />
      <main className="checkout-wrap">
        <div className={isAmountStep ? 'checkout-toolbar amount-toolbar' : isOtpStep ? 'checkout-toolbar otp-toolbar' : 'checkout-toolbar'}>
          <span>Secure checkout</span>
          {session?.status === 'PENDING' && (
            <strong className={countdown.seconds < 30 ? 'timer timer-warning' : 'timer'}>
              {countdown.label} remaining
            </strong>
          )}
        </div>
        <div className={isCardStep ? 'checkout-grid card-step-grid' : isOtpStep ? 'checkout-grid otp-step-grid' : isAmountStep ? 'checkout-grid amount-step-grid' : 'checkout-grid'}>
          <div className="checkout-main">
            {timeoutError && <p className="form-error" role="alert">{timeoutError}</p>}
            <Outlet />
          </div>
          {isCardStep && session && (
            <aside className="checkout-aside">
              <AmountSummary amount={session.amount} currency={session.currency} />
            </aside>
          )}
        </div>
        <p className="footer-note">Rupio is a simulated gateway. No real money is charged.</p>
      </main>
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
