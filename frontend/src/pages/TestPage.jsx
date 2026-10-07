import { useState } from 'react';
import BrandHeader from '../components/BrandHeader.jsx';
import { createTestSession } from '../api/rupioApi.js';

export default function TestPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
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
      setLoading(false);
    }
  }

  return (
    <main className="result-shell">
      <BrandHeader />
      <section className="panel result-panel">
        <p className="eyebrow">RUPIO TEST</p>
        <h1>Try a test checkout</h1>
        <p className="muted">Start once, then follow the checkout steps: amount, test card, and result.</p>
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
    </main>
  );
}
