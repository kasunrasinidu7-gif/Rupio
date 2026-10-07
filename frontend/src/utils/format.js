export function formatMoney(amount, currency = 'LKR') {
  const fractionDigits = currency === 'LKR' ? 0 : 2;
  try {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(Number(amount) || 0);
  } catch {
    return currency + ' ' + (Number(amount) || 0).toFixed(fractionDigits);
  }
}

export function statusLabel(status) {
  const labels = {
    SUCCESS: 'Payment successful',
    FAILED: 'Payment declined',
    CANCELLED: 'Payment cancelled',
    TIMEOUT: 'Session timed out'
  };
  return labels[status] || 'Payment status';
}
