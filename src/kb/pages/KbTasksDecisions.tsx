import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ListChecks,
  Gavel,
  Plus,
  Check,
  X,
  Trash2,
  Loader2,
  Sparkles,
  CircleDot,
} from 'lucide-react';
import { listProjects, listDocuments, listTasks, listDecisions, listFindings, createTask, updateTask, deleteTask, createDecision, updateDecision, deleteDecision, updateFinding } from '@/kb/data';
import type { KbProject, KbTask, KbDecision, KbFinding, TaskPriority, TaskStatus } from '@/kb/types';
import { KbCard, KbBadge, KbButton, KbInput, KbSelect, KbField, KbTextarea, KbEmpty, KbSpinner, KbError } from '@/kb/ui';
import { useKbAuth } from '@/kb/KbAuthContext';

const PRIORITY_TONE: Record<TaskPriority, 'slate' | 'blue' | 'amber' | 'red'> = {
  low: 'slate',
  medium: 'blue',
  high: 'amber',
  critical: 'red',
};

const STATUS_TONE: Record<TaskStatus, 'amber' | 'blue' | 'green' | 'red'> = {
  pending: 'amber',
  in_progress: 'blue',
  completed: 'green',
  blocked: 'red',
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function KbTasksDecisions() {
  const { session } = useKbAuth();
  const [params] = useSearchParams();
  const [projects, setProjects] = useState<KbProject[]>([]);
  const [projectId, setProjectId] = useState(params.get('project') ?? '');
  const [tasks, setTasks] = useState<KbTask[]>([]);
  const [decisions, setDecisions] = useState<KbDecision[]>([]);
  const [findings, setFindings] = useState<KbFinding[]>([]);
  const [docs, setDocs] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', detail: '', assignee: '', priority: 'medium' as TaskPriority, status: 'pending' as TaskStatus, due_date: '', depends_on: '' });
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [decisionForm, setDecisionForm] = useState({ title: '', rationale: '', decided_on: '' });

  const refresh = async (pid: string) => {
    const [t, d, f, docList] = await Promise.all([listTasks(pid), listDecisions(pid), listFindings(pid), listDocuments(pid)]);
    setTasks(t);
    setDecisions(d);
    setFindings(f);
    setDocs(docList.map((x) => ({ id: x.id, title: x.title })));
  };

  useEffect(() => {
    if (!session) return;
    listProjects()
      .then((ps) => {
        setProjects(ps);
        if (ps.length > 0 && !params.get('project')) setProjectId(ps[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Projects load nahi hue'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    refresh(projectId)
      .catch((err) => setError(err instanceof Error ? err.message : 'Data load nahi hua'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const addTask = async () => {
    if (!taskForm.title.trim() || !projectId) return;
    setBusy(true);
    setError(null);
    try {
      await createTask({
        project_id: projectId,
        title: taskForm.title.trim(),
        detail: taskForm.detail.trim(),
        assignee: taskForm.assignee.trim(),
        priority: taskForm.priority,
        status: taskForm.status,
        due_date: taskForm.due_date || null,
        depends_on_task_id: taskForm.depends_on || null,
        origin: 'manual',
      });
      setTaskForm({ title: '', detail: '', assignee: '', priority: 'medium', status: 'pending', due_date: '', depends_on: '' });
      setShowTaskForm(false);
      await refresh(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task save nahi hua');
    } finally {
      setBusy(false);
    }
  };

  const addDecision = async () => {
    if (!decisionForm.title.trim() || !projectId) return;
    setBusy(true);
    setError(null);
    try {
      await createDecision({
        project_id: projectId,
        title: decisionForm.title.trim(),
        rationale: decisionForm.rationale.trim(),
        decided_on: decisionForm.decided_on || null,
        origin: 'manual',
      });
      setDecisionForm({ title: '', rationale: '', decided_on: '' });
      setShowDecisionForm(false);
      await refresh(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decision save nahi hua');
    } finally {
      setBusy(false);
    }
  };

  const convertFinding = async (f: KbFinding) => {
    if (!projectId) return;
    setBusy(true);
    try {
      if (f.kind === 'pending_task' || f.kind === 'completed_task') {
        await createTask({
          project_id: projectId,
          title: f.payload.title,
          detail: f.payload.detail ?? '',
          status: f.kind === 'completed_task' ? 'completed' : 'pending',
          document_id: f.document_id,
          origin: 'ai',
          linked_finding_id: f.id,
        });
      } else if (f.kind === 'decision') {
        await createDecision({
          project_id: projectId,
          title: f.payload.title,
          rationale: f.payload.rationale ?? f.payload.detail ?? '',
          decided_on: f.payload.decided_on ?? null,
          document_id: f.document_id,
          origin: 'ai',
          linked_finding_id: f.id,
        });
      }
      await updateFinding(f.id, { review_state: 'approved' });
      await refresh(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Convert nahi hua');
    } finally {
      setBusy(false);
    }
  };

  if (projects.length === 0 && !loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-semibold">Tasks & Decisions</h1>
        <KbEmpty icon={ListChecks} title="Pehle ek project banayein" hint="Tasks aur decisions har project ke saath judte hain." />
      </div>
    );
  }

  const pendingFindings = findings.filter((f) => (f.kind === 'pending_task' || f.kind === 'completed_task' || f.kind === 'decision') && f.review_state === 'pending');

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Tasks & Decisions</h1>
        <p className="text-sm text-slate-500">AI-extracted aur manually created items — dono alag-alag dikhaye gaye hain.</p>
      </div>

      {error && <div className="mb-4"><KbError message={error} /></div>}

      <div className="mb-6 max-w-sm">
        <KbField label="Project">
          <KbSelect
            value={projectId}
            onChange={(v) => setProjectId(v)}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
        </KbField>
      </div>

      {pendingFindings.length > 0 && (
        <KbCard className="mb-8 border-amber-500/20">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-amber-200">
            <Sparkles className="h-4 w-4" /> AI findings awaiting review ({pendingFindings.length})
          </h2>
          <p className="mb-3 text-xs text-slate-500">Approve karne par ye tasks/decisions ban jayenge. Ya Analyzer page se unhe edit/approve karein.</p>
          <ul className="flex flex-col gap-2">
            {pendingFindings.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">{f.payload.title}</p>
                  <p className="text-[11px] text-slate-600">
                    {f.kind === 'decision' ? 'Decision' : f.kind === 'completed_task' ? 'Completed task' : 'Pending task'} · AI extracted
                    {f.document_id && docs.find((d) => d.id === f.document_id) ? ` · Source: ${docs.find((d) => d.id === f.document_id)!.title}` : ''}
                  </p>
                </div>
                <KbButton disabled={busy} onClick={() => void convertFinding(f)}>
                  <Check className="h-3.5 w-3.5" /> Approve as {f.kind === 'decision' ? 'decision' : 'task'}
                </KbButton>
              </li>
            ))}
          </ul>
        </KbCard>
      )}

      {/* -------- tasks -------- */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ListChecks className="h-5 w-5 text-blue-400" /> Tasks ({tasks.length})
        </h2>
        <KbButton onClick={() => setShowTaskForm(!showTaskForm)}>
          <Plus className="h-4 w-4" /> Add task
        </KbButton>
      </div>

      {showTaskForm && (
        <KbCard className="mb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <KbField label="Task title *">
                <KbInput value={taskForm.title} onChange={(v) => setTaskForm({ ...taskForm, title: v })} placeholder="e.g. Update API documentation" />
              </KbField>
            </div>
            <div className="sm:col-span-2">
              <KbField label="Detail">
                <KbTextarea value={taskForm.detail} onChange={(v) => setTaskForm({ ...taskForm, detail: v })} rows={2} />
              </KbField>
            </div>
            <KbField label="Assignee">
              <KbInput value={taskForm.assignee} onChange={(v) => setTaskForm({ ...taskForm, assignee: v })} placeholder="Team member ka naam" />
            </KbField>
            <KbField label="Priority">
              <KbSelect value={taskForm.priority} onChange={(v) => setTaskForm({ ...taskForm, priority: v as TaskPriority })} options={PRIORITY_OPTIONS} />
            </KbField>
            <KbField label="Status">
              <KbSelect value={taskForm.status} onChange={(v) => setTaskForm({ ...taskForm, status: v as TaskStatus })} options={STATUS_OPTIONS} />
            </KbField>
            <KbField label="Due date">
              <KbInput type="date" value={taskForm.due_date} onChange={(v) => setTaskForm({ ...taskForm, due_date: v })} />
            </KbField>
            <div className="sm:col-span-2">
              <KbField label="Depends on">
                <KbSelect
                  value={taskForm.depends_on}
                  onChange={(v) => setTaskForm({ ...taskForm, depends_on: v })}
                  options={[{ value: '', label: 'No dependency' }, ...tasks.map((t) => ({ value: t.id, label: t.title }))]}
                />
              </KbField>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <KbButton variant="ghost" onClick={() => setShowTaskForm(false)}>Cancel</KbButton>
            <KbButton disabled={busy || !taskForm.title.trim()} onClick={addTask}>{busy ? 'Saving...' : 'Add task'}</KbButton>
          </div>
        </KbCard>
      )}

      {loading ? (
        <KbSpinner />
      ) : tasks.length === 0 ? (
        <KbEmpty icon={ListChecks} title="Koi task nahi" hint="Manually add karein ya AI findings approve karein." />
      ) : (
        <div className="mb-10 flex flex-col gap-2">
          {tasks.map((t) => {
            const dep = tasks.find((x) => x.id === t.depends_on_task_id);
            const doc = docs.find((d) => d.id === t.document_id);
            return (
              <KbCard key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${t.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{t.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <KbBadge tone={STATUS_TONE[t.status]}>{STATUS_OPTIONS.find((s) => s.value === t.status)?.label}</KbBadge>
                    <KbBadge tone={PRIORITY_TONE[t.priority]}>{t.priority}</KbBadge>
                    {t.assignee && <span>{t.assignee}</span>}
                    {t.due_date && <span>Due: {t.due_date}</span>}
                    {dep && <span>Depends on: {dep.title}</span>}
                    {doc && <span>Source: {doc.title}</span>}
                    {t.origin === 'ai' && (
                      <KbBadge tone="violet"><Sparkles className="h-3 w-3" /> AI</KbBadge>
                    )}
                  </div>
                </div>
                <div className="flex flex-none items-center gap-1.5">
                  {t.status !== 'completed' && (
                    <button title="Mark completed" onClick={() => void updateTask(t.id, { status: 'completed' }).then(() => refresh(projectId))} className="rounded-lg border border-emerald-500/30 p-2 text-emerald-300 hover:bg-emerald-500/10">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {t.status === 'completed' && (
                    <button title="Reopen" onClick={() => void updateTask(t.id, { status: 'pending' }).then(() => refresh(projectId))} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800">
                      <CircleDot className="h-4 w-4" />
                    </button>
                  )}
                  <button title="Delete" onClick={() => void deleteTask(t.id).then(() => refresh(projectId))} className="rounded-lg border border-rose-500/30 p-2 text-rose-300 hover:bg-rose-500/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </KbCard>
            );
          })}
        </div>
      )}

      {/* -------- decisions -------- */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Gavel className="h-5 w-5 text-blue-400" /> Decisions ({decisions.length})
        </h2>
        <KbButton onClick={() => setShowDecisionForm(!showDecisionForm)}>
          <Plus className="h-4 w-4" /> Add decision
        </KbButton>
      </div>

      {showDecisionForm && (
        <KbCard className="mb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <KbField label="Decision *">
                <KbInput value={decisionForm.title} onChange={(v) => setDecisionForm({ ...decisionForm, title: v })} placeholder="e.g. PostgreSQL ko database ke roop me chuna" />
              </KbField>
            </div>
            <div className="sm:col-span-2">
              <KbField label="Why (rationale)">
                <KbTextarea value={decisionForm.rationale} onChange={(v) => setDecisionForm({ ...decisionForm, rationale: v })} rows={2} />
              </KbField>
            </div>
            <KbField label="Decision date (if known)">
              <KbInput type="date" value={decisionForm.decided_on} onChange={(v) => setDecisionForm({ ...decisionForm, decided_on: v })} />
            </KbField>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <KbButton variant="ghost" onClick={() => setShowDecisionForm(false)}>Cancel</KbButton>
            <KbButton disabled={busy || !decisionForm.title.trim()} onClick={addDecision}>{busy ? 'Saving...' : 'Add decision'}</KbButton>
          </div>
        </KbCard>
      )}

      {loading ? (
        <KbSpinner />
      ) : decisions.length === 0 ? (
        <KbEmpty icon={Gavel} title="Koi decision record nahi" hint="Important decisions yahan save karein taaki wo kabhi na khohein." />
      ) : (
        <div className="flex flex-col gap-2">
          {decisions.map((d) => {
            const doc = docs.find((x) => x.id === d.document_id);
            return (
              <KbCard key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-100">{d.title}</p>
                  {d.rationale && <p className="mt-0.5 text-xs text-slate-500">Why: {d.rationale}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {d.decided_on && <span>Decided: {d.decided_on}</span>}
                    {doc && <span>Source: {doc.title}</span>}
                    {d.origin === 'ai' && <KbBadge tone="violet"><Sparkles className="h-3 w-3" /> AI</KbBadge>}
                    <KbBadge tone={d.review_state === 'approved' ? 'green' : d.review_state === 'rejected' ? 'red' : 'amber'}>{d.review_state}</KbBadge>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-1.5">
                  {d.review_state !== 'approved' && (
                    <button title="Approve" onClick={() => void updateDecision(d.id, { review_state: 'approved' }).then(() => refresh(projectId))} className="rounded-lg border border-emerald-500/30 p-2 text-emerald-300 hover:bg-emerald-500/10">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {d.review_state !== 'rejected' && (
                    <button title="Reject" onClick={() => void updateDecision(d.id, { review_state: 'rejected' }).then(() => refresh(projectId))} className="rounded-lg border border-rose-500/30 p-2 text-rose-300 hover:bg-rose-500/10">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button title="Delete" onClick={() => void deleteDecision(d.id).then(() => refresh(projectId))} className="rounded-lg border border-rose-500/30 p-2 text-rose-300 hover:bg-rose-500/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </KbCard>
            );
          })}
        </div>
      )}

      {busy && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" /> Working...
        </div>
      )}
    </div>
  );
}
