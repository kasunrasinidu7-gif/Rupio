import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPayment, retryCheckoutSession } from '../api/rupioApi.js';
import BrandHeader from '../components/BrandHeader.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { formatMoney, statusLabel } from '../utils/format.js';

export default function ResultPage() {
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [returning, setReturning] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');
  const returnLock = useRef(false);
  const retryLock = useRef(false);

  useEffect(() => {
    let active = true;
    getPayment(paymentId)
      .then((result) => { if (active) setPayment(result.payment); })
      .catch((loadError) => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [paymentId]);

  if (!payment && !error) return <LoadingScreen minimal message="Loading your payment result…" />;

  async function retryPayment() {
    if (retryLock.current) return;
    retryLock.current = true;
    setRetrying(true);
    setRetryError('');
    try {
      const retry = await retryCheckoutSession(payment.sessionId);
      window.location.assign(retry.checkoutUrl);
    } catch (retryRequestError) {
      setRetryError(retryRequestError.message);
      retryLock.current = false;
      setRetrying(false);
    }
  }

  function returnHome() {
    if (returnLock.current) return;
    returnLock.current = true;
    setReturning(true);
    const hostBridge = window.RupioCheckout;
    if (hostBridge && typeof hostBridge.postMessage === 'function') {
      hostBridge.postMessage('return-home');
      return;
    }
    if (payment.returnUrl) window.location.assign(payment.returnUrl);
    else window.history.back();
  }

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
                  {['FAILED', 'DECLINED', 'TIMEOUT'].includes(payment.status) && (
                    <>
                      <button
                        className="copy-id-button retry-payment-button"
                        type="button"
                        onClick={retryPayment}
                        disabled={retrying}
                      >
                        {retrying ? 'Starting…' : 'Try again'}
                      </button>
                      {retryError && <p className="form-error" role="alert">{retryError}</p>}
                    </>
                  )}
                  <button className="primary-button dashboard-button" type="button" onClick={returnHome} disabled={returning}>
                    {returning ? 'Returning…' : 'Return to Home'}
                  </button>
                </>}
          </section>
        </div>
      </div>
    </main>
  );
}
