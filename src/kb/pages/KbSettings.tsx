import { useEffect, useState } from 'react';
import { Settings, LogOut, Save, Loader2, FlaskConical, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { KbCard, KbButton, KbInput, KbSelect, KbField, KbSpinner, KbError } from '@/kb/ui';
import { useKbAuth } from '@/kb/KbAuthContext';

interface Profile {
  display_name: string;
  ai_mode: 'auto' | 'demo';
}

export default function KbSettings() {
  const { session } = useKbAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('kb_profiles')
      .select('display_name, ai_mode')
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setProfile({ display_name: data?.display_name ?? '', ai_mode: (data?.ai_mode as 'auto' | 'demo') ?? 'auto' });
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const { data: existing } = await supabase.from('kb_profiles').select('id').maybeSingle();
    const payload = { display_name: profile.display_name.trim(), ai_mode: profile.ai_mode };
    const { error: err } = existing
      ? await supabase.from('kb_profiles').update(payload).eq('id', existing.id)
      : await supabase.from('kb_profiles').insert(payload);
    if (err) setError('Settings save nahi hui. Dobara koshish karein.');
    else setSaved(true);
    setSaving(false);
  };

  if (loading) return <KbSpinner label="Settings load ho rahi hain..." />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-500">Workspace ki basic details aur analysis mode.</p>
      </div>

      {error && <div className="mb-4"><KbError message={error} onRetry={() => setSaved(false)} /></div>}

      {profile && (
        <KbCard className="mb-6">
          <div className="flex flex-col gap-5">
            <KbField label="Display name">
              <KbInput value={profile.display_name} onChange={(v) => { setProfile({ ...profile, display_name: v }); setSaved(false); }} placeholder="Aapka naam" />
            </KbField>

            <KbField label="Analysis mode">
              <KbSelect
                value={profile.ai_mode}
                onChange={(v) => { setProfile({ ...profile, ai_mode: v as 'auto' | 'demo' }); setSaved(false); }}
                options={[
                  { value: 'auto', label: 'Auto — AI configured ho to AI, warna demo' },
                  { value: 'demo', label: 'Always demo (offline keyword analysis)' },
                ]}
              />
            </KbField>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-500">
              <p className="mb-2 flex items-center gap-2 text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Real AI mode: Gemini API key server-side configured honi chahiye. Key kabhi browser mein nahi jaati.
              </p>
              <p className="flex items-start gap-2">
                <FlaskConical className="mt-0.5 h-4 w-4 flex-none text-amber-400" />
                Demo mode: keyword-based hai — clearly "demo" label ke saath dikhta hai, real AI nahi hai.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <KbButton disabled={saving} onClick={save}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save settings
              </KbButton>
              {saved && <span className="text-xs text-emerald-400">Saved</span>}
            </div>
          </div>
        </KbCard>
      )}

      <KbCard>
        <h2 className="mb-1 text-sm font-semibold text-slate-200">Account</h2>
        <p className="mb-4 text-xs text-slate-500">{session?.user.email}</p>
        <KbButton variant="ghost" onClick={() => void supabase.auth.signOut()}>
          <LogOut className="h-4 w-4" /> Sign out
        </KbButton>
      </KbCard>
    </div>
  );
}
