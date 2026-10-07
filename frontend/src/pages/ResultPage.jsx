import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPayment } from '../api/rupioApi.js';
import AmountSummary from '../components/AmountSummary.jsx';
import BrandHeader from '../components/BrandHeader.jsx';
import PaymentStatus from '../components/PaymentStatus.jsx';

export default function ResultPage() {
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getPayment(paymentId)
      .then((result) => { if (active) setPayment(result.payment); })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [paymentId]);

  if (error) return <main className="result-shell"><div className="panel error-panel" role="alert">{error}</div></main>;
  if (!payment) return <main className="result-shell"><div className="panel loading-panel">Loading payment result…</div></main>;

  return (
    <main className="result-shell">
      <BrandHeader />
      <section className="panel result-panel">
        <PaymentStatus status={payment.status} message={payment.message} />
        <AmountSummary
          amount={payment.amount}
          currency={payment.currency}
          reference={payment.clientReference}
          compact
        />
        <div className="receipt-row"><span>Rupio reference</span><code>{payment.paymentId}</code></div>
        <div className="receipt-row">
          <span>Merchant notification</span>
          <strong className={payment.callbackDelivery === 'DELIVERED' ? 'delivery-ok' : payment.callbackDelivery === 'FAILED' ? 'delivery-failed' : 'delivery-pending'}>
            {payment.callbackDelivery === 'DELIVERED' ? 'Sent' : payment.callbackDelivery === 'FAILED' ? 'Not delivered' : 'Pending'}
          </strong>
        </div>
        {payment.callbackMessage && payment.callbackDelivery !== 'DELIVERED' && (
          <p className="field-hint">Merchant callback: {payment.callbackMessage}</p>
        )}
        {payment.returnUrl
          ? <a className="primary-button button-link" href={payment.returnUrl}>Return to app <span aria-hidden="true">→</span></a>
          : <p className="field-hint">You can close this page and return to the app.</p>}
      </section>
      <p className="footer-note">Rupio is a simulated payment gateway. No real funds were moved.</p>
    </main>
  );
}
