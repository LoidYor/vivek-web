import { useState, type FormEvent } from 'react';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { adminInputClass, adminPrimaryButtonClass } from '@/components/admin/adminStyles';

type Mode = 'signIn' | 'signUp';

export default function AdminSignInForm() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = () => {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    if (mode === 'signIn') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(
          signInError.status === 400
            ? 'Email or password is incorrect.'
            : 'Could not sign in right now. Please try again.',
        );
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError('Could not create the account. Try a different email or a stronger password.');
      } else {
        setNotice('Account created. Ask the site owner to grant it admin access.');
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto p-8 rounded-2xl bg-ink-900 border border-stone-800">
      <h2 className="font-display text-2xl text-stone-100 mb-2">
        {mode === 'signIn' ? 'Sign in to manage materials' : 'Create an admin account'}
      </h2>
      <p className="text-sm text-stone-500 mb-8">
        {mode === 'signIn'
          ? 'Only approved admins can upload or delete study materials.'
          : 'New accounts can only upload after the site owner grants access.'}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm text-stone-400">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={adminInputClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-stone-400">
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={adminInputClass}
          />
        </label>

        {error && <p className="text-sm text-red-300">{error}</p>}
        {notice && <p className="text-sm text-gold-300">{notice}</p>}

        <button
          type="submit"
          disabled={submitting}
          className={`mt-2 w-full ${adminPrimaryButtonClass}`}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : mode === 'signIn' ? (
            <LogIn className="w-4 h-4" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {mode === 'signIn' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        onClick={switchMode}
        className="mt-6 w-full text-sm text-stone-400 hover:text-gold-300 transition-colors"
      >
        {mode === 'signIn' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}
