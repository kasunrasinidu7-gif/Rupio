import { useRef, useState } from 'react';
import BrandHeader from '../components/BrandHeader.jsx';
import { createTestSession } from '../api/rupioApi.js';

export default function TestPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const startLock = useRef(false);

  async function startCheckout() {
    if (startLock.current) return;
    startLock.current = true;
    setError('');
    setLoading(true);
    try {
      const session = await createTestSession({
        clientReference: 'RUPIO-TEST-' + Date.now(),
        amount: 100,
        currency: 'LKR',
        returnUrl: window.location.origin + '/test'
      });
      window.location.assign(session.checkoutUrl);
    } catch (requestError) {
      setError(requestError.message);
      startLock.current = false;
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <BrandHeader />
      <div className="checkout-wrap">
        <div className="checkout-grid">
          <section className="panel result-panel">
            <div className="step-heading">
              <span className="step-number">01</span>
              <div>
                <p className="eyebrow">PAYMENT</p>
                <h1>Start checkout</h1>
                <p className="muted">Continue to enter an amount and payment details.</p>
              </div>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button
              className="primary-button button-link"
              type="button"
              onClick={startCheckout}
              disabled={loading}
            >
          {loading ? 'Starting…' : 'Start test checkout'} <span aria-hidden="true">→</span>
            </button>
          </section>
          <aside className="order-summary">
            <h2>Your Order</h2>
            <div className="order-total"><span>Total amount</span><strong>Set on next step</strong></div>
            <div className="order-detail"><span>Payment provider</span><span>Rupio</span></div>
          </aside>
        </div>
        <p className="footer-note">Demo checkout only. No real funds are moved.</p>
      </div>
    </main>
  );
}
