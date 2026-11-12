import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  FileText,
  Gavel,
  CheckCircle2,
  Circle,
  AlertTriangle,
  HelpCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { listProjects, listDocuments, listFindings, listTasks, listDecisions } from '@/kb/data';
import type { KbProject, KbDocument, KbFinding, KbTask, KbDecision } from '@/kb/types';
import { PROJECT_STATUS_LABELS } from '@/kb/types';
import { KbCard, KbBadge, KbEmpty, KbSpinner, KbError } from '@/kb/ui';
import { useKbAuth } from '@/kb/KbAuthContext';

interface Stats {
  projects: number;
  documents: number;
  decisions: number;
  tasksCompleted: number;
  tasksPending: number;
  risks: number;
  questions: number;
}

export default function KbDashboard() {
  const { session } = useKbAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<KbProject[]>([]);
  const [docs, setDocs] = useState<KbDocument[]>([]);
  const [findings, setFindings] = useState<KbFinding[]>([]);
  const [tasks, setTasks] = useState<KbTask[]>([]);
  const [decisions, setDecisions] = useState<KbDecision[]>([]);
  const [stats, setStats] = useState<Stats>({ projects: 0, documents: 0, decisions: 0, tasksCompleted: 0, tasksPending: 0, risks: 0, questions: 0 });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const ps = await listProjects();
      const allDocs: KbDocument[] = [];
      const allFindings: KbFinding[] = [];
      const allTasks: KbTask[] = [];
      const allDecisions: KbDecision[] = [];
      for (const p of ps) {
        const [d, f, t, dec] = await Promise.all([
          listDocuments(p.id),
          listFindings(p.id),
          listTasks(p.id),
          listDecisions(p.id),
        ]);
        allDocs.push(...d);
        allFindings.push(...f);
        allTasks.push(...t);
        allDecisions.push(...dec);
      }
      setProjects(ps);
      setDocs(allDocs);
      setFindings(allFindings);
      setTasks(allTasks);
      setDecisions(allDecisions);
      setStats({
        projects: ps.length,
        documents: allDocs.length,
        decisions: allDecisions.filter((d) => d.review_state === 'approved').length,
        tasksCompleted: allTasks.filter((t) => t.status === 'completed').length,
        tasksPending: allTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length,
        risks: allFindings.filter((f) => f.kind === 'risk' && f.review_state === 'approved').length,
        questions: allFindings.filter((f) => f.kind === 'question' && f.review_state !== 'rejected').length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Data load nahi hua');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  if (loading) return <KbSpinner label="Dashboard load ho raha hai..." />;
  if (error) return <KbError message={error} onRetry={load} />;

  const statCards = [
    { icon: FolderKanban, label: 'Projects', value: stats.projects, to: '/knowledgebridge/projects' },
    { icon: FileText, label: 'Documents', value: stats.documents, to: '/knowledgebridge/library' },
    { icon: Gavel, label: 'Approved Decisions', value: stats.decisions, to: '/knowledgebridge/tasks' },
    { icon: CheckCircle2, label: 'Completed Tasks', value: stats.tasksCompleted, to: '/knowledgebridge/tasks' },
    { icon: Circle, label: 'Pending Tasks', value: stats.tasksPending, to: '/knowledgebridge/tasks' },
    { icon: AlertTriangle, label: 'Known Risks', value: stats.risks, to: '/knowledgebridge/analyzer' },
    { icon: HelpCircle, label: 'Open Questions', value: stats.questions, to: '/knowledgebridge/analyzer' },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Overview Dashboard</h1>
          <p className="text-sm text-slate-500">Project intelligence across all of your work.</p>
        </div>
        <Link
          to="/knowledgebridge/projects"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <KbEmpty
          icon={FolderKanban}
          title="Welcome! Aapka workspace khali hai"
          hint="Shuru karne ke liye pehla project banayein. Uske baad documents upload karein, AI analysis chalayein, aur handover report generate karein."
        />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {statCards.map(({ icon: Icon, label, value, to }) => (
              <Link key={label} to={to} className="group">
                <KbCard className="transition-colors group-hover:border-blue-500/40">
                  <Icon className="mb-2 h-4 w-4 text-blue-400" />
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="text-[11px] leading-tight text-slate-500">{label}</p>
                </KbCard>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <KbCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">Your Projects</h2>
                <Link to="/knowledgebridge/projects" className="text-xs text-blue-400 hover:text-blue-300">
                  View all
                </Link>
              </div>
              {projects.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">Koi project nahi hai.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {projects.slice(0, 5).map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/knowledgebridge/projects?project=${p.id}`}
                        className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2.5 text-sm transition-colors hover:border-blue-500/40"
                      >
                        <span className="truncate text-slate-200">{p.name}</span>
                        <KbBadge tone={p.status === 'active' ? 'green' : p.status === 'archived' ? 'slate' : 'blue'}>
                          {PROJECT_STATUS_LABELS[p.status]}
                        </KbBadge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </KbCard>

            <KbCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">Recent Documents</h2>
                <Link to="/knowledgebridge/library" className="text-xs text-blue-400 hover:text-blue-300">
                  Library
                </Link>
              </div>
              {docs.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">Abhi koi document upload nahi hua.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {docs.slice(0, 5).map((d) => (
                    <li key={d.id} className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2.5 text-sm">
                      <span className="truncate text-slate-200">{d.title}</span>
                      <KbBadge tone={d.status === 'processed' ? 'green' : d.status === 'failed' ? 'red' : 'amber'}>
                        {d.status}
                      </KbBadge>
                    </li>
                  ))}
                </ul>
              )}
            </KbCard>

            <KbCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">Pending Tasks</h2>
                <Link to="/knowledgebridge/tasks" className="text-xs text-blue-400 hover:text-blue-300">
                  All tasks
                </Link>
              </div>
              {tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length === 0 ? (
                <p className="py-4 text-sm text-slate-500">Koi pending task nahi.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {tasks
                    .filter((t) => t.status === 'pending' || t.status === 'in_progress')
                    .slice(0, 5)
                    .map((t) => (
                      <li key={t.id} className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2.5 text-sm">
                        <span className="truncate text-slate-200">{t.title}</span>
                        <KbBadge tone={t.priority === 'critical' ? 'red' : t.priority === 'high' ? 'amber' : 'slate'}>
                          {t.priority}
                        </KbBadge>
                      </li>
                    ))}
                </ul>
              )}
            </KbCard>

            <KbCard>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">Recent Decisions</h2>
                <Link to="/knowledgebridge/tasks" className="text-xs text-blue-400 hover:text-blue-300">
                  All decisions
                </Link>
              </div>
              {decisions.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">Koi decision record nahi hua.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {decisions.slice(0, 5).map((d) => (
                    <li key={d.id} className="flex items-center justify-between rounded-lg border border-slate-800 px-3 py-2.5 text-sm">
                      <span className="truncate text-slate-200">{d.title}</span>
                      <KbBadge tone={d.review_state === 'approved' ? 'green' : d.review_state === 'rejected' ? 'red' : 'amber'}>
                        {d.review_state}
                      </KbBadge>
                    </li>
                  ))}
                </ul>
              )}
            </KbCard>
          </div>

          <KbCard className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-200">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/knowledgebridge/library"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500/40 hover:text-blue-300"
              >
                Upload documents <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/knowledgebridge/analyzer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500/40 hover:text-blue-300"
              >
                Run AI analysis <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/knowledgebridge/handover"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500/40 hover:text-blue-300"
              >
                Prepare handover <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </KbCard>
        </>
      )}
    </div>
  );
}
