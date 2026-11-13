import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowRightLeft, FileText, Download, Loader2, HelpCircle } from 'lucide-react';
import { listProjects, listDocuments, listFindings, listTasks, listDecisions, saveReport } from '@/kb/data';
import type { KbProject, KbDocument, KbFinding, KbTask, KbDecision, HandoverReport } from '@/kb/types';
import { PROJECT_STATUS_LABELS, DOC_TYPE_LABELS } from '@/kb/types';
import { KbCard, KbBadge, KbButton, KbSelect, KbField, KbEmpty, KbSpinner, KbError } from '@/kb/ui';
import { useKbAuth } from '@/kb/KbAuthContext';

export default function KbHandover() {
  const { session } = useKbAuth();
  const [params] = useSearchParams();
  const [projects, setProjects] = useState<KbProject[]>([]);
  const [projectId, setProjectId] = useState(params.get('project') ?? '');
  const [docs, setDocs] = useState<KbDocument[]>([]);
  const [findings, setFindings] = useState<KbFinding[]>([]);
  const [tasks, setTasks] = useState<KbTask[]>([]);
  const [decisions, setDecisions] = useState<KbDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);

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
    setSavedReportId(null);
    Promise.all([listDocuments(projectId), listFindings(projectId), listTasks(projectId), listDecisions(projectId)])
      .then(([d, f, t, dec]) => {
        setDocs(d);
        setFindings(f);
        setTasks(t);
        setDecisions(dec);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Data load nahi hua'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (projects.length === 0 && !loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-semibold">Handover Center</h1>
        <KbEmpty icon={ArrowRightLeft} title="Pehle ek project banayein" hint="Handover ke liye project ka data chahiye." />
      </div>
    );
  }

  const project = projects.find((p) => p.id === projectId);
  const approved = (f: KbFinding) => f.review_state === 'approved' || f.review_state === 'edited';
  const docTitle = (id: string | null) => (id ? (docs.find((d) => d.id === id)?.title ?? null) : null);

  const approvedDecisions = decisions.filter((d) => d.review_state === 'approved' || d.review_state === 'edited');
  const approvedRisks = findings.filter((f) => f.kind === 'risk' && approved(f));
  const approvedDeps = findings.filter((f) => f.kind === 'dependency' && approved(f));
  const questions = findings.filter((f) => f.kind === 'question' && f.review_state !== 'rejected');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const blockedTasks = tasks.filter((t) => t.status === 'blocked');

  const missingInfo: string[] = [];
  if (!project?.objective) missingInfo.push('Project objective document nahi hai');
  if (decisions.length === 0) missingInfo.push('Koi decision record nahi hua');
  if (docs.length === 0) missingInfo.push('Koi source document upload nahi hua');
  if (questions.length > 0) missingInfo.push(`${questions.length} sawaal abhi bhi adhoore hain`);
  if (tasks.some((t) => !t.assignee)) missingInfo.push('Kuch tasks ka assignee nahi hai');

  const buildReport = (): HandoverReport => ({
    generatedAt: new Date().toISOString(),
    project: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      objective: project?.objective ?? '',
      teamName: project?.team_name ?? '',
      ownerName: project?.owner_name ?? '',
      status: project ? PROJECT_STATUS_LABELS[project.status] : '',
      startDate: project?.start_date ?? null,
      targetDate: project?.target_date ?? null,
    },
    approvedDecisions: approvedDecisions.map((d) => ({ title: d.title, rationale: d.rationale, decidedOn: d.decided_on, source: docTitle(d.document_id) })),
    completedTasks: completedTasks.map((t) => ({ title: t.title, assignee: t.assignee, source: docTitle(t.document_id) })),
    pendingTasks: pendingTasks.map((t) => ({ title: t.title, assignee: t.assignee, priority: t.priority, dueDate: t.due_date, source: docTitle(t.document_id) })),
    blockedTasks: blockedTasks.map((t) => ({ title: t.title, assignee: t.assignee, source: docTitle(t.document_id) })),
    approvedRisks: approvedRisks.map((f) => ({ title: f.payload.title, detail: f.payload.detail ?? '', source: docTitle(f.document_id) })),
    approvedDependencies: approvedDeps.map((f) => ({ title: f.payload.title, detail: f.payload.detail ?? '', source: docTitle(f.document_id) })),
    openQuestions: questions.map((f) => ({ title: f.payload.title, detail: f.payload.detail ?? '', source: docTitle(f.document_id) })),
    documents: docs.map((d) => ({ title: d.title, type: DOC_TYPE_LABELS[d.doc_type], addedOn: new Date(d.created_at).toLocaleDateString() })),
    missingInfo,
  });

  const generate = async () => {
    if (!projectId || !project) return;
    setGenerating(true);
    setError(null);
    try {
      const report = buildReport();
      const saved = await saveReport(projectId, `Handover — ${project.name}`, report);
      setSavedReportId(saved.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report save nahi hui');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Handover Center</h1>
          <p className="text-sm text-slate-500">Naya team member bina purane member ke project samajh sake.</p>
        </div>
        <KbButton disabled={generating || !projectId} onClick={generate}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {generating ? 'Preparing...' : 'Prepare handover data'}
        </KbButton>
      </div>

      {error && <div className="mb-4"><KbError message={error} /></div>}

      <div className="mb-6 max-w-sm">
        <KbField label="Project">
          <KbSelect value={projectId} onChange={(v) => setProjectId(v)} options={projects.map((p) => ({ value: p.id, label: p.name }))} />
        </KbField>
      </div>

      {savedReportId && (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Handover data save ho gaya. Report download karne ke liye{' '}
          <Link to="/knowledgebridge/reports" className="underline">Reports page</Link> par jayein.
        </div>
      )}

      {loading ? (
        <KbSpinner label="Project data load ho raha hai..." />
      ) : (
        project && (
          <div className="flex flex-col gap-6">
            <KbCard>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{project.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{project.description || 'No description'}</p>
                </div>
                <KbBadge tone={project.status === 'active' ? 'green' : 'blue'}>{PROJECT_STATUS_LABELS[project.status]}</KbBadge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Objective</p>
                  <p className="text-slate-200">{project.objective || 'Missing'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Team</p>
                  <p className="text-slate-200">{project.team_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Owner</p>
                  <p className="text-slate-200">{project.owner_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Timeline</p>
                  <p className="text-slate-200">{project.start_date ?? '—'} to {project.target_date ?? '—'}</p>
                </div>
              </div>
            </KbCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <KbCard>
                <h3 className="mb-3 text-sm font-semibold text-slate-200">Important approved decisions ({approvedDecisions.length})</h3>
                {approvedDecisions.length === 0 ? <p className="text-xs text-slate-500">Koi approved decision nahi — Analyzer se approve karein.</p> : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {approvedDecisions.map((d) => (
                      <li key={d.id} className="border-l-2 border-emerald-500/40 pl-3">
                        <p className="text-slate-200">{d.title}</p>
                        {d.rationale && <p className="text-xs text-slate-500">Why: {d.rationale}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </KbCard>

              <KbCard>
                <h3 className="mb-3 text-sm font-semibold text-slate-200">Known risks ({approvedRisks.length})</h3>
                {approvedRisks.length === 0 ? <p className="text-xs text-slate-500">Koi approved risk nahi.</p> : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {approvedRisks.map((f) => (
                      <li key={f.id} className="border-l-2 border-rose-500/40 pl-3">
                        <p className="text-slate-200">{f.payload.title}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </KbCard>

              <KbCard>
                <h3 className="mb-3 text-sm font-semibold text-slate-200">Pending tasks ({pendingTasks.length})</h3>
                {pendingTasks.length === 0 ? <p className="text-xs text-slate-500">Sab tasks complete hain.</p> : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {pendingTasks.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-2">
                        <span className="truncate text-slate-200">{t.title}</span>
                        <KbBadge tone={t.priority === 'critical' ? 'red' : t.priority === 'high' ? 'amber' : 'slate'}>{t.priority}</KbBadge>
                      </li>
                    ))}
                  </ul>
                )}
              </KbCard>

              <KbCard>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <HelpCircle className="h-4 w-4 text-amber-400" /> Open questions ({questions.length})
                </h3>
                {questions.length === 0 ? <p className="text-xs text-slate-500">Koi adhoora sawaal nahi.</p> : (
                  <ul className="flex flex-col gap-2 text-sm">
                    {questions.map((f) => (
                      <li key={f.id} className="border-l-2 border-amber-500/40 pl-3">
                        <p className="text-slate-200">{f.payload.title}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </KbCard>
            </div>

            <KbCard>
              <h3 className="mb-3 text-sm font-semibold text-slate-200">Missing information</h3>
              {missingInfo.length === 0 ? (
                <p className="text-xs text-emerald-300">Project ka zaroori information complete lag raha hai.</p>
              ) : (
                <ul className="list-inside list-disc text-xs text-amber-300">
                  {missingInfo.map((m) => <li key={m}>{m}</li>)}
                </ul>
              )}
              <p className="mt-2 text-[11px] text-slate-600">Jo pata nahi hai usse clearly "missing" dikhaya jaata hai — koi fasla data nahi banaya jaata.</p>
            </KbCard>
          </div>
        )
      )}
    </div>
  );
}
