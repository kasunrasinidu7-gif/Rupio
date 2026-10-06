export function formatMoney(amount, currency = 'LKR') {
  try {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(Number(amount) || 0);
  } catch {
    return currency + ' ' + (Number(amount) || 0).toFixed(2);
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
