import { Outlet, useParams } from 'react-router-dom';
import { CheckoutProvider, useCheckout } from '../context/CheckoutContext.jsx';
import useCountdown from '../hooks/useCountdown.js';
import BrandHeader from './BrandHeader.jsx';

function CheckoutFrame() {
  const { session, loading } = useCheckout();
  const countdown = useCountdown(session?.expiresAt);
  return (
    <div className="app-shell">
      <BrandHeader />
      <main className="checkout-wrap">
        <div className="secure-row">
          <span>Secure test checkout</span>
          {session?.status === 'PENDING' && (
            <span className={countdown.seconds < 30 ? 'timer timer-warning' : 'timer'}>
              Expires in {countdown.label}
            </span>
          )}
        </div>
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
