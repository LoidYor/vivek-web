import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  History,
  FolderPlus,
  FileText,
  Gavel,
  ListPlus,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { listProjects, listEvents, listDocuments } from '@/kb/data';
import type { KbProject, KbTimelineEvent, EventType } from '@/kb/types';
import { KbCard, KbBadge, KbSelect, KbField, KbEmpty, KbSpinner, KbError } from '@/kb/ui';
import { useKbAuth } from '@/kb/KbAuthContext';

const EVENT_META: Record<EventType, { label: string; icon: typeof History }> = {
  project_created: { label: 'Project Created', icon: FolderPlus },
  document_added: { label: 'Document Added', icon: FileText },
  decision: { label: 'Decision', icon: Gavel },
  task_created: { label: 'Task Created', icon: ListPlus },
  task_completed: { label: 'Task Completed', icon: CheckCircle2 },
  status_change: { label: 'Status Change', icon: ArrowUpRight },
  analysis_run: { label: 'Analysis Run', icon: Sparkles },
  approved_knowledge: { label: 'Knowledge Approved', icon: ShieldCheck },
};

export default function KbTimeline() {
  const { session } = useKbAuth();
  const [params] = useSearchParams();
  const [projects, setProjects] = useState<KbProject[]>([]);
  const [projectId, setProjectId] = useState(params.get('project') ?? '');
  const [events, setEvents] = useState<KbTimelineEvent[]>([]);
  const [docs, setDocs] = useState<{ id: string; title: string }[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | EventType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    Promise.all([listEvents(projectId), listDocuments(projectId)])
      .then(([e, d]) => {
        setEvents(e);
        setDocs(d.map((x) => ({ id: x.id, title: x.title })));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Timeline load nahi hua'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (projects.length === 0 && !loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-semibold">Knowledge Timeline</h1>
        <KbEmpty icon={History} title="Pehle ek project banayein" hint="Timeline project ki history dikhata hai." />
      </div>
    );
  }

  const filtered = events.filter((e) => typeFilter === 'all' || e.event_type === typeFilter);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Knowledge Timeline</h1>
        <p className="text-sm text-slate-500">Project ki chronological history — decisions, documents aur tasks ki asli dates ke saath.</p>
      </div>

      {error && <div className="mb-4"><KbError message={error} /></div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <KbField label="Project">
          <KbSelect value={projectId} onChange={(v) => setProjectId(v)} options={projects.map((p) => ({ value: p.id, label: p.name }))} />
        </KbField>
        <KbField label="Event type">
          <KbSelect
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as 'all' | EventType)}
            options={[
              { value: 'all', label: 'All events' },
              ...(Object.keys(EVENT_META) as EventType[]).map((t) => ({ value: t, label: EVENT_META[t].label })),
            ]}
          />
        </KbField>
      </div>

      {loading ? (
        <KbSpinner label="Timeline load ho raha hai..." />
      ) : filtered.length === 0 ? (
        <KbEmpty icon={History} title={events.length === 0 ? 'Koi event nahi' : 'Is type ka koi event nahi'} hint="Events automatically bante hain jab aap project, document, task ya decision add karte hain." />
      ) : (
        <div className="relative border-l border-slate-800 pl-6">
          {filtered.map((e) => {
            const meta = EVENT_META[e.event_type];
            const Icon = meta.icon;
            const doc = docs.find((d) => d.id === e.document_id);
            return (
              <div key={e.id} className="relative mb-5">
                <div className="absolute -left-[34px] flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900">
                  <Icon className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <KbCard className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-slate-100">{e.title}</p>
                    <KbBadge tone="slate">{meta.label}</KbBadge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {e.occurred_on ? `Event date: ${e.occurred_on}` : `Recorded: ${new Date(e.created_at).toLocaleDateString()}`}
                    {doc && ` · Source: ${doc.title}`}
                  </p>
                  {e.detail && <p className="mt-1 text-xs text-slate-600">{e.detail}</p>}
                </KbCard>
              </div>
            );
          })}
          <p className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
            <RefreshCw className="h-3 w-3" />
            Document ki upload date aur event ki asli date alag dikhayi jaati hain.
          </p>
        </div>
      )}
    </div>
  );
}
