import { formatMoney } from '../utils/format.js';

export default function AmountSummary({ amount, currency, reference, compact = false }) {
  return (
    <section className={compact ? 'amount-summary compact' : 'amount-summary'}>
      <div className="summary-top">
        <span className="eyebrow">PAYING TO</span>
        <span className="summary-reference">{reference || 'Payment reference'}</span>
      </div>
      <div className="summary-amount">{formatMoney(amount, currency)}</div>
      <div className="summary-bottom">
        <span>Payment reference</span>
        <span>{reference || '—'}</span>
      </div>
    </section>
  );
}
