import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPayment } from '../api/rupioApi.js';
import BrandHeader from '../components/BrandHeader.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { formatMoney, statusLabel } from '../utils/format.js';

export default function ResultPage() {
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    getPayment(paymentId)
      .then((result) => { if (active) setPayment(result.payment); })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [paymentId]);

  if (!payment && !error) return <LoadingScreen message="Loading your payment result…" />;

  async function copyPaymentId() {
    try {
      await navigator.clipboard.writeText(payment.paymentId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="app-shell">
      <BrandHeader />
      <div className="checkout-wrap">
        <div className="checkout-grid result-grid result-only">
          <section className="panel result-panel">
            {error
              ? <div className="error-panel" role="alert">{error}</div>
              : <>
                  <div className={'result-status result-status-' + (payment.status === 'SUCCESS' ? 'success' : payment.status === 'TIMEOUT' ? 'timeout' : 'failure')} role="status">
                    <span className="result-status-icon" aria-hidden="true">{payment.status === 'SUCCESS' ? '✓' : '!'}</span>
                    <h1>{statusLabel(payment.status)}</h1>
                  </div>
                  <div className="result-amount">{formatMoney(payment.amount, payment.currency)}</div>
                  <div className="transaction-id">
                    <span>Transaction ID</span>
                    <code>{payment.paymentId}</code>
                    <button className="copy-id-button" type="button" onClick={copyPaymentId}>{copied ? 'Copied' : 'Copy'}</button>
                  </div>
                  <button className="primary-button dashboard-button" type="button" onClick={() => payment.returnUrl ? window.location.assign(payment.returnUrl) : window.history.back()}>
                    Return to Home
                  </button>
                </>}
          </section>
        </div>
      </div>
    </main>
  );
}
