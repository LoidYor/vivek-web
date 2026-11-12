import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface KbAuthValue {
  session: Session | null;
  loading: boolean;
}

const KbAuthContext = createContext<KbAuthValue>({ session: null, loading: true });

export function KbAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return <KbAuthContext.Provider value={{ session, loading }}>{children}</KbAuthContext.Provider>;
}

export function useKbAuth(): KbAuthValue {
  return useContext(KbAuthContext);
}
