import { formatMoney } from '../utils/format.js';

export default function AmountSummary({ amount, currency }) {
  return (
    <section className="order-summary">
      <h2>Your Order</h2>
      <div className="order-total">
        <span>Total amount</span>
        <strong>{formatMoney(amount, currency)}</strong>
      </div>
    </section>
  );
}
