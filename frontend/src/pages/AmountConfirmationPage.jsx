import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCheckout } from '../context/CheckoutContext.jsx';
import { formatMoney } from '../utils/format.js';
import PaymentStatus from '../components/PaymentStatus.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import PrimaryButton from '../components/PrimaryButton.jsx';

export default function AmountConfirmationPage() {
  const { session, loading, error } = useCheckout();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);

  function continueToCard() {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true);
    navigate('/checkout/' + sessionId + '/card');
  }

  if (loading) return <LoadingScreen message="Loading amount confirmation…" />;
  if (error) return <section className="panel error-panel" role="alert">{error}</section>;
  if (!session) return null;
  if (session.status !== 'PENDING') {
    return <section className="panel"><PaymentStatus status={session.status} message={session.resultMessage} /></section>;
  }

  return (
    <section className="panel confirmation-panel">
      <div className="confirmation-heading">
        <h1>Confirm payment</h1>
      </div>
      <div className="confirmation-amount">
        <span>Amount</span>
        <strong>{formatMoney(session.amount, session.currency)}</strong>
      </div>
      {session.environment === 'test' ? (
        <Link className="edit-amount-link" to={'/checkout/' + sessionId} state={{ restoreAmount: true }}>Edit amount</Link>
      ) : session.editAmountUrl ? (
        <a className="edit-amount-link" href={session.editAmountUrl}>Edit amount</a>
      ) : null}
      <PrimaryButton type="button" onClick={continueToCard} disabled={busy}>
        {busy ? 'Please wait…' : 'Confirm'}
      </PrimaryButton>
    </section>
  );
}
