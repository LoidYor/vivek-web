import type { FindingKind, FindingPayload } from './types';

export interface RawFinding {
  kind: FindingKind;
  payload: FindingPayload;
}

export interface AnalysisResponse {
  mode: 'ai' | 'demo';
  findings: RawFinding[];
  model?: string;
  notice?: string;
}

export interface DocSnippet {
  documentId: string;
  title: string;
  text: string;
}

const KIND_LABEL: Record<FindingKind, string> = {
  decision: 'decision',
  completed_task: 'completed task',
  pending_task: 'pending task',
  risk: 'risk',
  dependency: 'dependency',
  question: 'unanswered question',
};

function buildPrompt(snippets: DocSnippet[]): string {
  const docBlocks = snippets
    .map((s) => `--- SOURCE DOCUMENT: ${s.title} (id: ${s.documentId}) ---\n${s.text.slice(0, 12_000)}`)
    .join('\n\n');
  return `You are a project knowledge analyst. Analyze the project documents below and extract structured findings.

Extract these kinds of findings:
- "decision": a decision that was made, with the reason if stated.
- "completed_task": work that is confirmed done, with evidence.
- "pending_task": work that remains to be done.
- "risk": a technical risk, delay, unresolved issue or missing documentation.
- "dependency": something this work depends on (task, technology or external party).
- "question": something unclear, conflicting or missing that a new team member should ask about.

Rules:
- Only report what the documents actually support. Never invent dates, names or facts.
- For every finding set "documentId" to the id of the source document and "evidence" to a short verbatim quote from that document supporting the finding. If no quote exists, omit that document entirely.
- Keep "title" to one clear sentence.

Respond with ONLY a JSON object: {"findings":[{"kind":"decision","title":"...","detail":"...","rationale":"...","decidedOn":"YYYY-MM-DD or null","documentId":"...","evidence":"..."}]}

DOCUMENTS:

${docBlocks}`;
}

function parseAiJson(raw: string): RawFinding[] {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI response JSON nahi tha');
  const parsed = JSON.parse(raw.slice(start, end + 1)) as {
    findings?: { kind?: string; title?: string; detail?: string; rationale?: string; decidedOn?: string | null; documentId?: string; evidence?: string }[];
  };
  const validKinds = new Set(Object.keys(KIND_LABEL));
  return (parsed.findings ?? [])
    .filter((f) => f.kind && validKinds.has(f.kind) && f.title)
    .map((f) => ({
      kind: f.kind as FindingKind,
      payload: {
        title: f.title as string,
        detail: f.detail || undefined,
        rationale: f.rationale || undefined,
        decided_on: f.decidedOn || null,
        evidence: f.evidence || undefined,
      },
      documentId: f.documentId,
    }));
}

// Deterministic rule-based extraction used only in demo mode.
// It scans for explicit cue phrases and attaches the surrounding sentence.
const CUE_PATTERNS: { kind: FindingKind; re: RegExp }[] = [
  { kind: 'decision', re: /\b(decided|decision|agreed|we will use|chose|finalized)\b/i },
  { kind: 'completed_task', re: /\b(completed|finished|done|shipped|deployed|merged|delivered)\b/i },
  { kind: 'pending_task', re: /\b(pending|todo|to do|remaining|next step|needs to be|still to|awaiting)\b/i },
  { kind: 'risk', re: /\b(risk|blocked|delay|concern|issue|deadline may|might fail|broken)\b/i },
  { kind: 'dependency', re: /\b(depends on|dependent on|requires|waiting on|blocked by|needs)\b/i },
  { kind: 'question', re: /\b(unclear|not decided|tbd|question|confusion|unsure|open issue|need to ask)\b/i },
];

export function runDemoAnalysis(snippets: DocSnippet[]): RawFinding[] {
  const findings: RawFinding[] = [];
  for (const doc of snippets) {
    const sentences = doc.text.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 15 || trimmed.length > 320) continue;
      for (const { kind, re } of CUE_PATTERNS) {
        if (re.test(trimmed)) {
          findings.push({
            kind,
            payload: {
              title: trimmed.slice(0, 240),
              evidence: trimmed.slice(0, 240),
            },
            documentId: doc.documentId,
          });
          break;
        }
      }
      if (findings.length >= 40) return findings;
    }
  }
  return findings;
}

export async function runAnalysis(snippets: DocSnippet[]): Promise<AnalysisResponse> {
  const usable = snippets.filter((s) => s.text.trim().length > 0);
  if (usable.length === 0) {
    throw new Error('Analysis ke liye koi processed document nahi mila. Pehle documents upload karein aur unka text extract hone dein.');
  }

  let aiConfigured = false;
  try {
    const probe = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kb-analyze`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ probe: true }),
    });
    if (probe.ok) {
      const body = await probe.json();
      aiConfigured = Boolean(body?.aiConfigured);
    }
  } catch {
    aiConfigured = false;
  }

  if (!aiConfigured) {
    return {
      mode: 'demo',
      findings: runDemoAnalysis(usable),
      notice: 'Demo mode: ye findings simple keyword matching se nikale gaye hain, real AI se nahi. AI provider key configure hone par ye auto hota hai.',
    };
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kb-analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt: buildPrompt(usable) }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `AI analysis fail hua (${response.status})`);
  }
  const body = await response.json();
  const findings = parseAiJson(String(body?.text ?? ''));
  return { mode: 'ai', findings, model: body?.model };
}
