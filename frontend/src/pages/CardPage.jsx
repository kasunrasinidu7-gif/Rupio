import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { processPayment } from '../api/rupioApi.js';
import AmountSummary from '../components/AmountSummary.jsx';
import CardSecurityGuide from '../components/CardSecurityGuide.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import PaymentStatus from '../components/PaymentStatus.jsx';
import { useCheckout } from '../context/CheckoutContext.jsx';

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

const TEST_CARD_NUMBERS = new Set([
  '4242424242424242',
  '4000000000000002',
  '4000000000000003'
]);

export default function CardPage() {
  const { session, loading, error: sessionError } = useCheckout();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [cardNetwork, setCardNetwork] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [showTestCards, setShowTestCards] = useState(false);
  const [error, setError] = useState('');
  const [cardNumberError, setCardNumberError] = useState('');
  const [busy, setBusy] = useState(false);

  function continueToOtp(event) {
    event.preventDefault();
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length !== 16) {
      setCardNumberError('Enter a 16-digit card number.');
      return;
    }
    if (!TEST_CARD_NUMBERS.has(digits)) {
      setCardNumberError('Use one of the Rupio test card numbers shown here.');
      return;
    }
    setCardNumberError('');
    setBusy(true);
    setError('');
    navigate('/checkout/' + sessionId + '/otp', {
      state: { cardDetails: { cardNumber, cardNetwork, expiry: expiryMonth + '/' + expiryYear.slice(-2), cvv } }
    });
  }

  async function cancelCheckout() {
    setBusy(true);
    setError('');
    try {
      const result = await processPayment({ sessionId, action: 'cancel' });
      navigate('/result/' + result.payment.paymentId);
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  function chooseSimulationCard(number) {
    setCardNumber(formatCardNumber(number));
    setCardNetwork('visa');
    setExpiryMonth('12');
    setExpiryYear(String(new Date().getFullYear() + 4));
    setCvv('123');
    setCardNumberError('');
    setShowTestCards(false);
  }

  if (loading) return <LoadingScreen message="Loading your payment details…" />;
  if (sessionError) return <div className="panel error-panel" role="alert">{sessionError}</div>;
  if (!session) return null;
  if (session.status !== 'PENDING' && session.paymentId) {
    return (
      <div className="panel">
        <PaymentStatus status={session.status} message={session.resultMessage} />
        <a className="text-link" href={'/result/' + session.paymentId}>View payment result</a>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  return (
    <section className="panel card-payment-panel">
      <div className="card-payment-title">
        <h1>Payment Details <svg className="lock-icon" viewBox="0 0 16 18" role="img" aria-label="Secure"><rect x="2" y="7" width="12" height="10" rx="2" /><path d="M5 7V5a3 3 0 0 1 6 0v2" /></svg></h1>
        <span className="required-note">* Required field</span>
      </div>

      <form className="card-payment-form" onSubmit={continueToOtp}>
        <fieldset className="card-type-fieldset">
          <legend>Card Type <span>*</span></legend>
          <div className="card-network-options">
            <label className="card-network-option">
              <input type="radio" name="cardNetwork" value="visa" checked={cardNetwork === 'visa'} onChange={() => setCardNetwork('visa')} required />
              <span className="visa-mark" aria-hidden="true">VISA</span>
              <span>Visa</span>
            </label>
            <label className="card-network-option">
              <input type="radio" name="cardNetwork" value="mastercard" checked={cardNetwork === 'mastercard'} onChange={() => setCardNetwork('mastercard')} required />
              <span className="mastercard-mark" aria-hidden="true"><i /><i /></span>
              <span>Mastercard</span>
            </label>
          </div>
        </fieldset>

        <div className="card-field card-number-field test-card-picker">
          <div className="card-field-label-row">
            <label className="field-label" htmlFor="card-number">Card Number <span>*</span></label>
            <button className="test-cards-trigger" type="button" aria-expanded={showTestCards} aria-controls="test-card-list" onClick={() => setShowTestCards((shown) => !shown)}>
              Test cards
            </button>
          </div>
          {showTestCards && (
            <div className="test-card-popover" id="test-card-list" role="group" aria-label="Simulation card numbers">
              <button type="button" onClick={() => chooseSimulationCard('4242424242424242')}><span>Success</span><code>4242 4242 4242 4242</code></button>
              <button type="button" onClick={() => chooseSimulationCard('4000000000000002')}><span>Declined</span><code>4000 0000 0000 0002</code></button>
              <button type="button" onClick={() => chooseSimulationCard('4000000000000003')}><span>Timeout</span><code>4000 0000 0000 0003</code></button>
            </div>
          )}
          <input
            className="text-input reference-input"
            id="card-number"
            autoComplete="cc-number"
            inputMode="numeric"
            maxLength={19}
            placeholder="Enter card number"
            value={cardNumber}
            aria-invalid={Boolean(cardNumberError)}
            aria-describedby={cardNumberError ? 'card-number-error' : undefined}
            onChange={(event) => {
              const digits = event.target.value.replace(/\D/g, '');
              setCardNumber(formatCardNumber(digits));
              setCardNumberError(digits.length > 16 ? 'Enter exactly 16 digits.' : '');
            }}
            required
          />
          {cardNumberError && <p className="form-error card-number-error" id="card-number-error" role="alert">{cardNumberError}</p>}
        </div>

        <div className="expiry-fields">
          <div className="card-field">
            <label className="field-label" htmlFor="expiry-month">Expiration Month <span>*</span></label>
            <select className="text-input reference-input" id="expiry-month" autoComplete="cc-exp-month" value={expiryMonth} onChange={(event) => setExpiryMonth(event.target.value)} required>
              <option value="" disabled>Month</option>
              {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map((month) => <option key={month} value={month}>{month}</option>)}
            </select>
          </div>
          <div className="card-field">
            <label className="field-label" htmlFor="expiry-year">Expiration Year <span>*</span></label>
            <select className="text-input reference-input" id="expiry-year" autoComplete="cc-exp-year" value={expiryYear} onChange={(event) => setExpiryYear(event.target.value)} required>
              <option value="" disabled>Year</option>
              {Array.from({ length: 12 }, (_, index) => String(currentYear + index)).map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>

        <div className="cvv-field">
          <label className="field-label" htmlFor="cvv">CVN <span>*</span></label>
          <p className="cvv-help">This code is a three or four digit number printed on the back or front of your card.</p>
          <div className="cvv-input-row">
            <input
              className="text-input reference-input cvv-input"
              id="cvv"
              autoComplete="cc-csc"
              inputMode="numeric"
              maxLength="4"
              value={cvv}
              onChange={(event) => setCvv(event.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
            <CardSecurityGuide />
          </div>
        </div>

        <AmountSummary amount={session.amount} currency={session.currency} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="card-form-actions">
          <button className="reference-cancel-button" type="button" onClick={cancelCheckout} disabled={busy}>Cancel</button>
          <button className="reference-pay-button" type="submit" disabled={busy || session.status !== 'PENDING'}>{busy ? 'Please wait…' : 'Pay'}</button>
        </div>
      </form>
    </section>
  );
}
