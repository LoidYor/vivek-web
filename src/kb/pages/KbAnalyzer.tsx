import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Play,
  Loader2,
  Check,
  X,
  Pencil,
  ShieldCheck,
  ShieldX,
  TriangleAlert,
  FlaskConical,
} from 'lucide-react';
import { listProjects, listDocuments, listFindings, createFinding, updateFinding, addEvent } from '@/kb/data';
import { runAnalysis, type AnalysisResponse } from '@/kb/analysis';
import type { KbProject, KbDocument, KbFinding, FindingKind, FindingPayload, ReviewState } from '@/kb/types';
import { FINDING_KIND_LABELS } from '@/kb/types';
import { KbCard, KbBadge, KbButton, KbSelect, KbField, KbEmpty, KbSpinner, KbError, KbTextarea } from '@/kb/ui';
import { useKbAuth } from '@/kb/KbAuthContext';

const KIND_ORDER: FindingKind[] = ['decision', 'completed_task', 'pending_task', 'risk', 'dependency', 'question'];

const REVIEW_TONE: Record<ReviewState, 'slate' | 'green' | 'red' | 'amber'> = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  edited: 'blue' as never,
};

export default function KbAnalyzer() {
  const { session } = useKbAuth();
  const [params] = useSearchParams();
  const [projects, setProjects] = useState<KbProject[]>([]);
  const [projectId, setProjectId] = useState(params.get('project') ?? '');
  const [docs, setDocs] = useState<KbDocument[]>([]);
  const [findings, setFindings] = useState<KbFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

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

  const load = async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    setError(null);
    try {
      const [d, f] = await Promise.all([listDocuments(pid), listFindings(pid)]);
      setDocs(d);
      setFindings(f);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Data load nahi hua');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) void load(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const analyze = async () => {
    if (!projectId) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const processed = docs.filter((d) => d.status === 'processed' && d.extracted_text.trim());
      const response = await runAnalysis(
        processed.map((d) => ({ documentId: d.id, title: d.title, text: d.extracted_text })),
      );
      // persist findings
      const analysisId = crypto.randomUUID();
      for (const rf of response.findings) {
        const docId = 'documentId' in rf && typeof (rf as { documentId?: string }).documentId === 'string'
          ? (rf as { documentId: string }).documentId
          : null;
        await createFinding({
          project_id: projectId,
          document_id: docId && processed.some((d) => d.id === docId) ? docId : null,
          kind: rf.kind,
          payload: rf.payload,
          origin: response.mode === 'ai' ? 'ai' : 'manual',
          analysis_id: analysisId,
        });
      }
      await addEvent(projectId, 'analysis_run', `Knowledge analysis run (${response.mode === 'ai' ? 'AI' : 'demo'} mode, ${response.findings.length} findings)`, '', null);
      setResult(response);
      await load(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis fail hua');
    } finally {
      setRunning(false);
    }
  };

  const setReview = async (f: KbFinding, state: ReviewState) => {
    setError(null);
    try {
      await updateFinding(f.id, {
        review_state: state,
        ...(state === 'edited' && !f.original_ai ? { original_ai: f.payload } : {}),
      });
      if (state === 'approved') {
        await addEvent(f.project_id, 'approved_knowledge', `Approved: ${f.payload.title}`, '', f.document_id);
      }
      await load(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update fail hua');
    }
  };

  const saveEdit = async (f: KbFinding) => {
    if (!editText.trim()) return;
    setError(null);
    try {
      await updateFinding(f.id, {
        payload: { ...f.payload, title: editText.trim() } as FindingPayload,
        review_state: 'edited',
        original_ai: f.original_ai ?? f.payload,
      });
      setEditingId(null);
      await load(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Edit save nahi hua');
    }
  };

  if (projects.length === 0 && !loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-semibold">AI Knowledge Analyzer</h1>
        <KbEmpty icon={Sparkles} title="Pehle ek project banayein" hint="Analysis ke liye kam se kam ek project aur uske processed documents chahiye." />
      </div>
    );
  }

  const processedCount = docs.filter((d) => d.status === 'processed').length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">AI Knowledge Analyzer</h1>
        <p className="text-sm text-slate-500">Documents se decisions, tasks, risks aur sawaal nikaalein — har finding ka source ke saath.</p>
      </div>

      {error && <div className="mb-4"><KbError message={error} /></div>}

      <KbCard className="mb-8">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-56">
            <KbField label="Project">
              <KbSelect
                value={projectId}
                onChange={(v) => setProjectId(v)}
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
              />
            </KbField>
          </div>
          <div className="flex-1 text-xs text-slate-500">
            {processedCount > 0
              ? `${processedCount} processed document${processedCount > 1 ? 's' : ''} ready for analysis.`
              : 'Koi processed document nahi — pehle Knowledge Library mein upload karein.'}
          </div>
          <KbButton disabled={running || processedCount === 0 || !projectId} onClick={analyze}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Analyzing...' : 'Run analysis'}
          </KbButton>
        </div>
        {result && (
          <div className={`mt-4 rounded-lg border px-4 py-3 text-xs ${result.mode === 'ai' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`}>
            {result.mode === 'ai' ? (
              <span className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
                Real AI analysis complete ({result.model}). {result.findings.length} findings saved — review karke approve karein.
              </span>
            ) : (
              <span className="flex items-start gap-2">
                <FlaskConical className="mt-0.5 h-4 w-4 flex-none" />
                {result.notice}
              </span>
            )}
          </div>
        )}
      </KbCard>

      {loading ? (
        <KbSpinner label="Findings load ho rahi hain..." />
      ) : findings.length === 0 ? (
        <KbEmpty icon={Sparkles} title="Abhi koi finding nahi hai" hint="Upar se analysis run karein — results yahan review ke liye aayenge." />
      ) : (
        <div className="flex flex-col gap-6">
          {KIND_ORDER.map((kind) => {
            const items = findings.filter((f) => f.kind === kind);
            if (items.length === 0) return null;
            return (
              <div key={kind}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  {FINDING_KIND_LABELS[kind]} ({items.length})
                </h2>
                <div className="flex flex-col gap-2">
                  {items.map((f) => {
                    const doc = docs.find((d) => d.id === f.document_id);
                    return (
                      <KbCard key={f.id} className="py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            {editingId === f.id ? (
                              <div className="flex flex-col gap-2">
                                <KbTextarea value={editText} onChange={setEditText} rows={2} />
                                <div className="flex gap-2">
                                  <KbButton onClick={() => void saveEdit(f)}>Save</KbButton>
                                  <KbButton variant="ghost" onClick={() => setEditingId(null)}>Cancel</KbButton>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm text-slate-100">{f.payload.title}</p>
                                {f.payload.rationale && <p className="mt-1 text-xs text-slate-500">Why: {f.payload.rationale}</p>}
                                {f.payload.evidence && (
                                  <p className="mt-2 border-l-2 border-slate-700 pl-3 text-xs italic text-slate-400">
                                    "{f.payload.evidence}"{doc ? <span className="not-italic text-slate-600"> — {doc.title}</span> : null}
                                  </p>
                                )}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {f.origin === 'ai' ? (
                                    <KbBadge tone="violet"><Sparkles className="h-3 w-3" /> AI</KbBadge>
                                  ) : (
                                    <KbBadge tone="slate">Manual</KbBadge>
                                  )}
                                  <KbBadge tone={REVIEW_TONE[f.review_state]}>{f.review_state.replace('_', ' ')}</KbBadge>
                                  {doc && <span className="text-[11px] text-slate-600">Source: {doc.title}</span>}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex flex-none items-center gap-1.5">
                            {f.review_state !== 'approved' && (
                              <button title="Approve" onClick={() => void setReview(f, 'approved')} className="rounded-lg border border-emerald-500/30 p-2 text-emerald-300 transition-colors hover:bg-emerald-500/10">
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {f.review_state !== 'rejected' && (
                              <button title="Reject" onClick={() => void setReview(f, 'rejected')} className="rounded-lg border border-rose-500/30 p-2 text-rose-300 transition-colors hover:bg-rose-500/10">
                                <ShieldX className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              title="Edit"
                              onClick={() => {
                                setEditingId(f.id);
                                setEditText(f.payload.title);
                              }}
                              className="rounded-lg border border-slate-700 p-2 text-slate-400 transition-colors hover:bg-slate-800"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {f.review_state === 'pending' && (
                              <button title="Mark for verification" onClick={() => void setReview(f, 'pending')} className="rounded-lg border border-amber-500/30 p-2 text-amber-300 transition-colors hover:bg-amber-500/10">
                                <TriangleAlert className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </KbCard>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <p className="flex items-center gap-2 text-xs text-slate-600">
            <X className="h-3 w-3" />
            Sirf approved findings hi handover report aur verified knowledge mein shamil hote hain. Rejected findings kabhi use nahi hote.
          </p>
        </div>
      )}
    </div>
  );
}
