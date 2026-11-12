import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { KbButton, KbField, KbInput, KbError } from '@/kb/ui';
import { Network } from 'lucide-react';

export default function KbSignIn() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setNotice('Account ban gaya. Ab sign in karein.');
        setMode('signin');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes('Invalid login credentials')
          ? 'Email ya password galat hai.'
          : 'Sign in nahi ho paya. Dobara koshish karein.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/70 p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10">
            <Network className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">KnowledgeBridge AI</h1>
            <p className="text-xs text-slate-500">{mode === 'signin' ? 'Sign in to your workspace' : 'Create your workspace account'}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4">
          <KbField label="Email">
            <KbInput value={email} onChange={setEmail} type="email" placeholder="you@team.com" />
          </KbField>
          <KbField label="Password">
            <KbInput value={password} onChange={setPassword} type="password" placeholder="••••••••" />
          </KbField>
        </div>

        {error && <div className="mb-4"><KbError message={error} /></div>}
        {notice && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <KbButton onClick={submit} disabled={busy || !email || !password} className="w-full">
            {busy ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </KbButton>
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
              setNotice(null);
            }}
            className="text-xs text-slate-400 hover:text-blue-300 transition-colors"
          >
            {mode === 'signin' ? 'Naya account banayein' : 'Pehle se account hai? Sign in karein'}
          </button>
        </div>
      </div>
    </div>
  );
}
