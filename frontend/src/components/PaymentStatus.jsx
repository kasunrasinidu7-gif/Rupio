import { statusLabel } from '../utils/format.js';

export default function PaymentStatus({ status, message }) {
  const tone = status === 'SUCCESS' ? 'success' : status === 'PENDING' ? 'pending' : 'failure';
  const symbol = status === 'SUCCESS' ? '✓' : status === 'PENDING' ? '…' : '!';
  return (
    <div className={'payment-status ' + tone} role="status">
      <span className="status-icon" aria-hidden="true">{symbol}</span>
      <div>
        <h1>{statusLabel(status)}</h1>
        <p>{message || 'The payment result is being prepared.'}</p>
      </div>
    </div>
  );
}
