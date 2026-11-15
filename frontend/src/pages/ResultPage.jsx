import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPayment } from '../api/rupioApi.js';
import BrandHeader from '../components/BrandHeader.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
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

  if (!payment && !error) return <LoadingScreen message="Loading your payment result…" />;

  return (
    <main className="app-shell">
      <BrandHeader />
      <div className="checkout-wrap">
        <div className="checkout-grid result-grid result-only">
          <section className="panel result-panel">
            {error
              ? <div className="error-panel" role="alert">{error}</div>
              : <>
                  <PaymentStatus status={payment.status} message={payment.message} />
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
                    ? <a className="primary-button button-link" href={payment.returnUrl}>Return to app</a>
                    : <p className="field-hint">You can close this page and return to the app.</p>}
                </>}
          </section>
        </div>
        <p className="footer-note">Rupio simulated checkout. No real funds were moved.</p>
      </div>
    </main>
  );
}
