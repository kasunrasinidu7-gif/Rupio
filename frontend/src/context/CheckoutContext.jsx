import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSession } from '../api/rupioApi.js';

const CheckoutContext = createContext(null);

export function CheckoutProvider({ sessionId, children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const result = await getSession(sessionId);
    setSession(result.session);
    setError('');
    return result.session;
  }, [sessionId]);

  useEffect(() => {
    let active = true;
    let timer;
    const load = async () => {
      try {
        const result = await getSession(sessionId);
        if (active) {
          setSession(result.session);
          setError('');
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    if (!session || session.status === 'PENDING') {
      timer = window.setInterval(load, 2500);
    }
    return () => {
      active = false;
      if (timer) window.clearInterval(timer);
    };
  }, [sessionId, session?.status]);

  return (
    <CheckoutContext.Provider value={{ session, loading, error, refresh }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const value = useContext(CheckoutContext);
  if (!value) throw new Error('useCheckout must be used inside CheckoutProvider.');
  return value;
}
