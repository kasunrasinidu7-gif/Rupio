import { useEffect, useState } from 'react';

function remainingSeconds(expiresAt) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000));
}

export default function useCountdown(expiresAt) {
  const [seconds, setSeconds] = useState(() => remainingSeconds(expiresAt));

  useEffect(() => {
    setSeconds(remainingSeconds(expiresAt));
    const timer = window.setInterval(() => setSeconds(remainingSeconds(expiresAt)), 500);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, '0');
  return { seconds, label: minutes + ':' + remainder };
}
