import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Download, Trash2, Printer, Loader2 } from 'lucide-react';
import { listProjects, listReports, deleteReportRow } from '@/kb/data';
import type { KbProject, KbReport } from '@/kb/types';
import { KbCard, KbButton, KbSelect, KbField, KbEmpty, KbSpinner, KbError, KbBadge } from '@/kb/ui';
import { useKbAuth } from '@/kb/KbAuthContext';

function ReportView({ report }: { report: KbReport }) {
  const r = report.report;
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="report-section">
      <h3 className="mb-2 mt-6 border-b border-slate-800 pb-1 text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h3>
      {children}
    </div>
  );
  return (
    <div className="rounded-xl border border-slate-800 bg-white p-8 text-slate-900 print:bg-white" id="kb-report">
      <div className="mb-6 border-b-2 border-slate-900 pb-4">
        <h2 className="text-2xl font-bold">Project Handover Report</h2>
        <p className="mt-1 text-sm text-slate-600">
          {r.project.name} · Generated: {new Date(r.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="report-section">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Project Overview</h3>
        <p><strong>Team:</strong> {r.project.teamName || '—'}</p>
        <p><strong>Owner:</strong> {r.project.ownerName || '—'}</p>
        <p><strong>Status:</strong> {r.project.status}</p>
        <p><strong>Timeline:</strong> {r.project.startDate ?? '—'} to {r.project.targetDate ?? '—'}</p>
        <p className="mt-2">{r.project.description}</p>
        <p className="mt-2"><strong>Objective:</strong> {r.project.objective || 'Not documented'}</p>
      </div>

      <Section title={`Important Decisions (${r.approvedDecisions.length})`}>
        {r.approvedDecisions.length === 0 ? <p className="text-slate-500">No approved decisions.</p> : (
          <ul className="list-inside list-disc space-y-1">
            {r.approvedDecisions.map((d, i) => (
              <li key={i}>{d.title}{d.rationale && ` — ${d.rationale}`}{d.source && ` (Source: ${d.source})`}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Completed Tasks (${r.completedTasks.length})`}>
        {r.completedTasks.length === 0 ? <p className="text-slate-500">No completed tasks.</p> : (
          <ul className="list-inside list-disc space-y-1">
            {r.completedTasks.map((t, i) => <li key={i}>{t.title}{t.assignee && ` — ${t.assignee}`}</li>)}
          </ul>
        )}
      </Section>

      <Section title={`Pending Tasks (${r.pendingTasks.length})`}>
        {r.pendingTasks.length === 0 ? <p className="text-slate-500">No pending tasks.</p> : (
          <ul className="list-inside list-disc space-y-1">
            {r.pendingTasks.map((t, i) => (
              <li key={i}>{t.title} ({t.priority}){t.dueDate && ` — due ${t.dueDate}`}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Blocked Tasks (${r.blockedTasks.length})`}>
        {r.blockedTasks.length === 0 ? <p className="text-slate-500">No blocked tasks.</p> : (
          <ul className="list-inside list-disc space-y-1">
            {r.blockedTasks.map((t, i) => <li key={i}>{t.title}</li>)}
          </ul>
        )}
      </Section>

      <Section title={`Risks & Dependencies`}>
        {r.approvedRisks.length === 0 && r.approvedDependencies.length === 0 ? <p className="text-slate-500">None recorded.</p> : (
          <ul className="list-inside list-disc space-y-1">
            {r.approvedRisks.map((x, i) => <li key={`r${i}`}>Risk: {x.title}</li>)}
            {r.approvedDependencies.map((x, i) => <li key={`d${i}`}>Dependency: {x.title}</li>)}
          </ul>
        )}
      </Section>

      <Section title={`Unanswered Questions (${r.openQuestions.length})`}>
        {r.openQuestions.length === 0 ? <p className="text-slate-500">None.</p> : (
          <ul className="list-inside list-disc space-y-1">
            {r.openQuestions.map((q, i) => <li key={i}>{q.title}</li>)}
          </ul>
        )}
      </Section>

      <Section title={`Important Documents (${r.documents.length})`}>
        {r.documents.length === 0 ? <p className="text-slate-500">No documents.</p> : (
          <ul className="list-inside list-disc space-y-1">
            {r.documents.map((d, i) => <li key={i}>{d.title} ({d.type}, added {d.addedOn})</li>)}
          </ul>
        )}
      </Section>

      <Section title="Missing Information">
        {r.missingInfo.length === 0 ? <p className="text-slate-500">None identified.</p> : (
          <ul className="list-inside list-disc space-y-1 text-amber-700">
            {r.missingInfo.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}
      </Section>

      <p className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
        Sirf approved/verified findings is report mein shamil hain. Ye report KnowledgeBridge AI dwara generated hai.
      </p>
    </div>
  );
}

export default function KbReports() {
  const { session } = useKbAuth();
  const [params] = useSearchParams();
  const [projects, setProjects] = useState<KbProject[]>([]);
  const [projectId, setProjectId] = useState(params.get('project') ?? '');
  const [reports, setReports] = useState<KbReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewReport, setViewReport] = useState<KbReport | null>(null);

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

  const loadReports = async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    try {
      setReports(await listReports(pid));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reports load nahi hui');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) void loadReports(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const download = (report: KbReport) => {
    const content = JSON.stringify(report.report, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[^a-z0-9]+/gi, '_')}_${report.created_at.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (report: KbReport) => {
    setError(null);
    try {
      await deleteReportRow(report.id);
      if (viewReport?.id === report.id) setViewReport(null);
      await loadReports(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete nahi hua');
    }
  };

  if (projects.length === 0 && !loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-semibold">Reports</h1>
        <KbEmpty icon={FileText} title="Pehle ek project banayein" hint="Handover report generate karne ke liye project chahiye." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-slate-500">Generated handover reports — print-to-PDF ya JSON download karein.</p>
      </div>

      {error && <div className="mb-4"><KbError message={error} /></div>}

      <div className="mb-6 max-w-sm">
        <KbField label="Project">
          <KbSelect value={projectId} onChange={(v) => setProjectId(v)} options={projects.map((p) => ({ value: p.id, label: p.name }))} />
        </KbField>
      </div>

      {loading ? (
        <KbSpinner label="Reports load ho rahi hain..." />
      ) : reports.length === 0 ? (
        <KbEmpty icon={FileText} title="Koi report nahi bani" hint="Handover Center par ja kar 'Prepare handover data' click karein — phir report yahan aayegi." />
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <KbCard key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">{r.title}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-none items-center gap-2">
                <KbBadge tone="blue">{r.report.approvedDecisions.length} decisions</KbBadge>
                <KbButton variant="ghost" onClick={() => setViewReport(r)}>View</KbButton>
                <KbButton variant="ghost" onClick={() => download(r)}>
                  <Download className="h-3.5 w-3.5" /> JSON
                </KbButton>
                <KbButton variant="danger" onClick={() => void remove(r)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </KbButton>
              </div>
            </KbCard>
          ))}
        </div>
      )}

      {viewReport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" onClick={() => setViewReport(null)}>
          <div className="my-8 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Handover report preview</h3>
              <div className="flex gap-2">
                <KbButton variant="ghost" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
                </KbButton>
                <KbButton variant="ghost" onClick={() => setViewReport(null)}>Close</KbButton>
              </div>
            </div>
            <ReportView report={viewReport} />
          </div>
        </div>
      )}
    </div>
  );
}
