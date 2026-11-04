import { useEffect, useState } from 'react';
import { ShieldCheck, LogOut, Loader2, AlertCircle } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import PageHeader, { PageSection } from '@/components/PageHeader';
import AdminSignInForm from '@/components/admin/AdminSignInForm';
import MaterialUploadForm from '@/components/admin/MaterialUploadForm';
import MaterialsManager from '@/components/admin/MaterialsManager';
import { supabase } from '@/lib/supabase';
import { fetchIsAdmin } from '@/lib/materials';

type AccessState = 'checking' | 'signed-out' | 'not-admin' | 'admin' | 'error';

export default function AdminMaterialsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [access, setAccess] = useState<AccessState>('checking');
  const [libraryVersion, setLibraryVersion] = useState(0);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    if (!userId) {
      setAccess('signed-out');
      return;
    }
    let cancelled = false;
    setAccess('checking');
    fetchIsAdmin()
      .then((isAdmin) => {
        if (!cancelled) setAccess(isAdmin ? 'admin' : 'not-admin');
      })
      .catch(() => {
        if (!cancelled) setAccess('error');
      });
    return () => {
      cancelled = true;
    };
  }, [userId, sessionReady]);

  const handleSignOut = () => {
    void supabase.auth.signOut();
  };

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="Materials Admin"
        subtitle="Staff only"
        description="Upload notes, previous year papers and assignments for students, and remove anything that is no longer needed."
        accent="#fbbf24"
      />
      <PageSection>
        {access === 'checking' && (
          <div className="flex items-center justify-center gap-3 py-20 text-stone-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Checking access...
          </div>
        )}

        {access === 'signed-out' && <AdminSignInForm />}

        {(access === 'not-admin' || access === 'error') && (
          <div className="max-w-md mx-auto p-8 rounded-2xl bg-ink-900 border border-stone-800 text-center">
            <AlertCircle className="w-10 h-10 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-2xl text-stone-100 mb-3">
              {access === 'not-admin' ? 'No admin access' : 'Could not check access'}
            </h2>
            <p className="text-sm text-stone-500 mb-8">
              {access === 'not-admin'
                ? 'This account is not approved to manage materials yet.'
                : 'Something went wrong while checking your access. Please try again.'}
            </p>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-stone-300 bg-stone-800/60 hover:bg-stone-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}

        {access === 'admin' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-stone-500 truncate">Signed in as {session?.user.email}</p>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-gold-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
            <MaterialUploadForm onUploaded={() => setLibraryVersion((v) => v + 1)} />
            <MaterialsManager key={libraryVersion} />
          </div>
        )}
      </PageSection>
    </>
  );
}
