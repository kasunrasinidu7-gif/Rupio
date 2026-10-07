import { useEffect, useState } from 'react';

const STEP_SECONDS = 120;

export default function useCountdown(stepKey, enabled) {
  const [seconds, setSeconds] = useState(STEP_SECONDS);

  useEffect(() => {
    if (!enabled) {
      setSeconds(STEP_SECONDS);
      return undefined;
    }

    const deadline = Date.now() + STEP_SECONDS * 1000;
    const update = () => setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 500);
    return () => window.clearInterval(timer);
  }, [stepKey, enabled]);

  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, '0');
  return { seconds, label: minutes + ':' + remainder };
}
