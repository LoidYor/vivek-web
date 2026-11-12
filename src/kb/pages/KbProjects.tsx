import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Archive,
  Trash2,
  Pencil,
  X,
  Loader2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { listProjects, createProject, updateProject, deleteProject } from '@/kb/data';
import type { KbProject, ProjectStatus } from '@/kb/types';
import { PROJECT_STATUS_LABELS } from '@/kb/types';
import { KbCard, KbBadge, KbButton, KbInput, KbTextarea, KbSelect, KbField, KbEmpty, KbSpinner, KbError } from '@/kb/ui';
import { useKbAuth } from '@/kb/KbAuthContext';

const STATUS_OPTIONS = (Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => ({
  value: s,
  label: PROJECT_STATUS_LABELS[s],
}));

interface FormState {
  name: string;
  description: string;
  objective: string;
  team_name: string;
  owner_name: string;
  start_date: string;
  target_date: string;
  status: ProjectStatus;
}

const emptyForm: FormState = {
  name: '',
  description: '',
  objective: '',
  team_name: '',
  owner_name: '',
  start_date: '',
  target_date: '',
  status: 'planning',
};

export default function KbProjects() {
  const { session } = useKbAuth();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('project');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<KbProject[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KbProject | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<KbProject | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setProjects(await listProjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Projects load nahi hue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: KbProject) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      objective: p.objective,
      team_name: p.team_name,
      owner_name: p.owner_name,
      start_date: p.start_date ?? '',
      target_date: p.target_date ?? '',
      status: p.status,
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      objective: form.objective.trim(),
      team_name: form.team_name.trim(),
      owner_name: form.owner_name.trim(),
      start_date: form.start_date || null,
      target_date: form.target_date || null,
      status: form.status,
    };
    try {
      if (editing) {
        await updateProject(editing.id, payload);
      } else {
        await createProject(payload);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save nahi hua');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: KbProject) => {
    setBusy(true);
    try {
      await deleteProject(p.id);
      setConfirmDelete(null);
      if (selectedId === p.id) setParams({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete nahi hua');
    } finally {
      setBusy(false);
    }
  };

  const filtered = projects.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  if (loading) return <KbSpinner label="Projects load ho rahe hain..." />;

  // ---- project detail view ----
  if (selected) {
    return (
      <div className="mx-auto max-w-5xl">
        <button onClick={() => setParams({})} className="mb-6 text-sm text-slate-400 hover:text-blue-300">
          &larr; All projects
        </button>
        <KbCard className="mb-6">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">{selected.name}</h1>
              <p className="mt-1 text-sm text-slate-500">{selected.description || 'No description'}</p>
            </div>
            <div className="flex items-center gap-2">
              <KbBadge tone={selected.status === 'active' ? 'green' : selected.status === 'archived' ? 'slate' : 'blue'}>
                {PROJECT_STATUS_LABELS[selected.status]}
              </KbBadge>
              <KbButton variant="ghost" onClick={() => openEdit(selected)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </KbButton>
              <KbButton
                variant="ghost"
                onClick={() => void updateProject(selected.id, { status: 'archived' }).then(load)}
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </KbButton>
              <KbButton variant="danger" onClick={() => setConfirmDelete(selected)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </KbButton>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Objective</p>
              <p className="text-slate-200">{selected.objective || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Team</p>
              <p className="text-slate-200">{selected.team_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Owner</p>
              <p className="text-slate-200">{selected.owner_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Timeline</p>
              <p className="text-slate-200">
                {selected.start_date ?? '—'} to {selected.target_date ?? '—'}
              </p>
            </div>
          </div>
        </KbCard>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KbCard>
            <FileText className="mb-2 h-4 w-4 text-blue-400" />
            <p className="text-sm text-slate-300">Documents & analysis</p>
            <p className="mt-1 text-xs text-slate-500">Knowledge Library aur AI Analyzer mein ise explore karein.</p>
          </KbCard>
          <KbCard>
            <Sparkles className="mb-2 h-4 w-4 text-blue-400" />
            <p className="text-sm text-slate-300">Tasks & decisions</p>
            <p className="mt-1 text-xs text-slate-500">Tasks &amp; Decisions section mein manage karein.</p>
          </KbCard>
          <KbCard>
            <FolderKanban className="mb-2 h-4 w-4 text-blue-400" />
            <p className="text-sm text-slate-300">Timeline</p>
            <p className="mt-1 text-xs text-slate-500">Project history Timeline mein dekhein.</p>
          </KbCard>
          <KbCard>
            <Archive className="mb-2 h-4 w-4 text-blue-400" />
            <p className="text-sm text-slate-300">Handover</p>
            <p className="mt-1 text-xs text-slate-500">Handover Center se report banayein.</p>
          </KbCard>
        </div>

        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="mb-2 text-lg font-semibold text-rose-300">Delete project?</h3>
              <p className="mb-6 text-sm text-slate-400">
                "{confirmDelete.name}" aur uske saare documents, tasks, decisions, timeline events aur reports permanently delete ho jayenge. Ye undo nahi ho sakta.
              </p>
              <div className="flex justify-end gap-3">
                <KbButton variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</KbButton>
                <KbButton variant="danger" disabled={busy} onClick={() => void remove(confirmDelete)}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete forever
                </KbButton>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- list view ----
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-slate-500">Har project ka apna alag knowledge workspace hai.</p>
        </div>
        <KbButton onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Project
        </KbButton>
      </div>

      {error && <div className="mb-4"><KbError message={error} onRetry={load} /></div>}

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="w-44">
          <KbSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as 'all' | ProjectStatus)}
            options={[{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS]}
          />
        </div>
      </div>

      {showForm && (
        <KbCard className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{editing ? 'Edit project' : 'New project'}</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <KbField label="Project name *">
              <KbInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Payments Migration" />
            </KbField>
            <KbField label="Status">
              <KbSelect value={form.status} onChange={(v) => setForm({ ...form, status: v as ProjectStatus })} options={STATUS_OPTIONS} />
            </KbField>
            <div className="sm:col-span-2">
              <KbField label="Description">
                <KbTextarea value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Project kis baare mein hai" />
              </KbField>
            </div>
            <div className="sm:col-span-2">
              <KbField label="Objective">
                <KbTextarea value={form.objective} onChange={(v) => setForm({ ...form, objective: v })} placeholder="Project ka main goal" />
              </KbField>
            </div>
            <KbField label="Team name">
              <KbInput value={form.team_name} onChange={(v) => setForm({ ...form, team_name: v })} placeholder="e.g. Platform Team" />
            </KbField>
            <KbField label="Project owner">
              <KbInput value={form.owner_name} onChange={(v) => setForm({ ...form, owner_name: v })} placeholder="e.g. Vivek" />
            </KbField>
            <KbField label="Start date">
              <KbInput type="date" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} />
            </KbField>
            <KbField label="Target completion">
              <KbInput type="date" value={form.target_date} onChange={(v) => setForm({ ...form, target_date: v })} />
            </KbField>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <KbButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</KbButton>
            <KbButton disabled={busy || !form.name.trim()} onClick={submit}>
              {busy ? 'Saving...' : editing ? 'Save changes' : 'Create project'}
            </KbButton>
          </div>
        </KbCard>
      )}

      {filtered.length === 0 ? (
        <KbEmpty
          icon={FolderKanban}
          title={projects.length === 0 ? 'Koi project nahi hai' : 'Koi match nahi mila'}
          hint={projects.length === 0 ? 'New Project button se pehla project banayein.' : 'Search ya filter badal kar dekhein.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => setParams({ project: p.id })} className="text-left">
              <KbCard className="h-full transition-colors hover:border-blue-500/40">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-medium text-slate-100">{p.name}</h3>
                  <KbBadge tone={p.status === 'active' ? 'green' : p.status === 'archived' ? 'slate' : 'blue'}>
                    {PROJECT_STATUS_LABELS[p.status]}
                  </KbBadge>
                </div>
                <p className="line-clamp-2 text-xs text-slate-500">{p.description || 'No description'}</p>
                <p className="mt-3 text-[11px] text-slate-600">
                  {p.team_name && `Team: ${p.team_name} · `}
                  {p.target_date && `Target: ${p.target_date}`}
                </p>
              </KbCard>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
