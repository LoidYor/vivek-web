import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Library,
  Upload,
  FilePlus2,
  Trash2,
  Loader2,
  FileText,
  Search,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import {
  listProjects,
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentFileUrl,
} from '@/kb/data';
import type { KbProject, KbDocument, DocType } from '@/kb/types';
import { DOC_TYPE_LABELS } from '@/kb/types';
import { docTypeForFile, extractText, extractFromPasted, humanSize, MAX_FILE_BYTES } from '@/kb/extract';
import { KbCard, KbBadge, KbButton, KbInput, KbTextarea, KbSelect, KbField, KbEmpty, KbSpinner, KbError } from '@/kb/ui';
import { useKbAuth } from '@/kb/KbAuthContext';

export default function KbLibrary() {
  const { session } = useKbAuth();
  const [params] = useSearchParams();
  const [projects, setProjects] = useState<KbProject[]>([]);
  const [projectId, setProjectId] = useState<string>(params.get('project') ?? '');
  const [docs, setDocs] = useState<KbDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | DocType>('all');
  const [uploading, setUploading] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [viewDoc, setViewDoc] = useState<KbDocument | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<KbDocument | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

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

  const loadDocs = async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    setError(null);
    try {
      setDocs(await listDocuments(pid));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Documents load nahi hue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) void loadDocs(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !projectId) return;
    setUploading(true);
    setError(null);
    for (const file of Array.from(files)) {
      try {
        const docType = docTypeForFile(file);
        if (!docType) {
          throw new Error(`${file.name}: sirf PDF, TXT ya Markdown files supported hain`);
        }
        if (file.size > MAX_FILE_BYTES) {
          throw new Error(`${file.name}: file 10 MB se badi hai`);
        }
        const created = await createDocument({
          project_id: projectId,
          title: file.name,
          doc_type: docType,
          mime_type: file.type || null,
          size_bytes: file.size,
          status: 'processing',
        });
        const storagePath = `${session!.user.id}/${created.id}`;
        const { error: uploadErr } = await supabaseUpload(session!.user.id, created.id, file);
        if (uploadErr) throw new Error(`${file.name}: storage par upload fail hua`);
        try {
          const text = await extractText(file, docType);
          await updateDocument(created.id, {
            status: 'processed',
            extracted_text: text,
            storage_path: storagePath,
          });
        } catch (extractErr) {
          await updateDocument(created.id, {
            status: 'failed',
            status_error: extractErr instanceof Error ? extractErr.message : 'Text extraction fail hua',
            storage_path: storagePath,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload fail hua');
      }
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = '';
    await loadDocs(projectId);
  };

  const saveNote = async () => {
    if (!projectId || !noteTitle.trim() || !noteBody.trim()) return;
    setSavingNote(true);
    setError(null);
    try {
      const isMarkdown = noteBody.trim().startsWith('#');
      await createDocument({
        project_id: projectId,
        title: noteTitle.trim(),
        doc_type: isMarkdown ? 'md' : 'meeting_note',
        status: 'processed',
        extracted_text: extractFromPasted(noteTitle, noteBody),
      });
      setNoteTitle('');
      setNoteBody('');
      await loadDocs(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Note save nahi hua');
    } finally {
      setSavingNote(false);
    }
  };

  const remove = async (doc: KbDocument) => {
    setError(null);
    try {
      await deleteDocument(doc);
      setConfirmDelete(null);
      if (viewDoc?.id === doc.id) {
        setViewDoc(null);
        setViewUrl(null);
      }
      await loadDocs(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete nahi hua');
    }
  };

  const openDoc = async (doc: KbDocument) => {
    setViewDoc(doc);
    setViewUrl(null);
    if (doc.storage_path) {
      try {
        setViewUrl(await getDocumentFileUrl(doc.storage_path));
      } catch {
        setViewUrl(null);
      }
    }
  };

  const filtered = docs.filter((d) => {
    const matchesSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.extracted_text.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || d.doc_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (projects.length === 0 && !loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-semibold">Knowledge Library</h1>
        <KbEmpty icon={Library} title="Pehle ek project banayein" hint="Documents hamesha kisi project ke saath judte hain. Projects page par jao aur pehla project banao." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Knowledge Library</h1>
        <p className="text-sm text-slate-500">Project documents, meeting notes aur descriptions — sab ek jagah.</p>
      </div>

      {error && <div className="mb-4"><KbError message={error} /></div>}

      <div className="mb-6 max-w-sm">
        <KbField label="Project">
          <KbSelect
            value={projectId}
            onChange={(v) => {
              setProjectId(v);
              setParams({ project: v });
            }}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
        </KbField>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <KbCard>
          <div className="mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold">Upload files</h2>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            PDF (text-based), TXT ya Markdown — max 10 MB per file. Scanned PDF (photo wale) mein OCR nahi hai, unke liye text file ya meeting note use karein.
          </p>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            onChange={(e) => void handleFiles(e.target.files)}
            className="hidden"
            id="kb-file-input"
          />
          <label
            htmlFor="kb-file-input"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 px-4 py-8 text-center transition-colors hover:border-blue-500/50"
          >
            {uploading ? (
              <>
                <Loader2 className="mb-2 h-5 w-5 animate-spin text-blue-400" />
                <span className="text-sm text-slate-400">Upload aur extraction chal raha hai...</span>
              </>
            ) : (
              <>
                <Upload className="mb-2 h-5 w-5 text-slate-500" />
                <span className="text-sm text-slate-300">Click karke files chunein</span>
                <span className="mt-1 text-xs text-slate-600">PDF, TXT, MD</span>
              </>
            )}
          </label>
        </KbCard>

        <KbCard>
          <div className="mb-3 flex items-center gap-2">
            <FilePlus2 className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold">Meeting note ya description likhein</h2>
          </div>
          <div className="flex flex-col gap-3">
            <KbInput value={noteTitle} onChange={setNoteTitle} placeholder="Title, e.g. Sprint 4 planning meeting" />
            <KbTextarea value={noteBody} onChange={setNoteBody} rows={5} placeholder="Discussion, decisions, action items..." />
            <div className="flex justify-end">
              <KbButton disabled={savingNote || !noteTitle.trim() || !noteBody.trim()} onClick={saveNote}>
                {savingNote ? 'Saving...' : 'Save note'}
              </KbButton>
            </div>
          </div>
        </KbCard>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Documents search karein..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="w-44">
          <KbSelect
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as 'all' | DocType)}
            options={[
              { value: 'all', label: 'All types' },
              ...(Object.keys(DOC_TYPE_LABELS) as DocType[]).map((t) => ({ value: t, label: DOC_TYPE_LABELS[t] })),
            ]}
          />
        </div>
      </div>

      {loading ? (
        <KbSpinner label="Documents load ho rahe hain..." />
      ) : filtered.length === 0 ? (
        <KbEmpty icon={Library} title={docs.length === 0 ? 'Abhi koi document nahi' : 'Koi match nahi mila'} hint={docs.length === 0 ? 'Upar se file upload karein ya note likhein.' : 'Search badal kar dekhein.'} />
      ) : (
        <div className="grid gap-3">
          {filtered.map((d) => (
            <KbCard key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 flex-none text-slate-500" />
                  <p className="truncate text-sm font-medium text-slate-200">{d.title}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {DOC_TYPE_LABELS[d.doc_type]} · {humanSize(d.size_bytes)} · {new Date(d.created_at).toLocaleDateString()}
                  {d.doc_type === 'pdf' && d.status === 'failed' && ' · Scanned PDF hai to OCR support nahi hai'}
                </p>
                {d.status === 'failed' && d.status_error && (
                  <p className="mt-1 flex items-start gap-1 text-xs text-rose-300">
                    <AlertCircle className="mt-0.5 h-3 w-3 flex-none" /> {d.status_error}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <KbBadge tone={d.status === 'processed' ? 'green' : d.status === 'failed' ? 'red' : 'amber'}>
                  {d.status}
                </KbBadge>
                <KbButton variant="ghost" onClick={() => void openDoc(d)}>View</KbButton>
                <KbButton variant="danger" onClick={() => setConfirmDelete(d)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </KbButton>
              </div>
            </KbCard>
          ))}
        </div>
      )}

      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" onClick={() => setViewDoc(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-100">{viewDoc.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {DOC_TYPE_LABELS[viewDoc.doc_type]} · {viewDoc.status} · {new Date(viewDoc.created_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setViewDoc(null)} className="text-slate-500 hover:text-slate-300">✕</button>
            </div>
            {viewDoc.extracted_text ? (
              <pre className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs leading-relaxed text-slate-300">
                {viewDoc.extracted_text}
              </pre>
            ) : (
              <p className="text-sm text-slate-500">Is document ka extracted text nahi hai {viewDoc.status === 'failed' ? '(extraction fail hua)' : '(abhi process ho raha hai)'}.</p>
            )}
            {viewDoc.storage_path && (
              <div className="mt-4">
                {viewUrl ? (
                  <a href={viewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                    <ExternalLink className="h-4 w-4" /> Original file kholein
                  </a>
                ) : (
                  <p className="text-xs text-slate-600">Original file link available nahi hai.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="mb-2 text-lg font-semibold text-rose-300">Delete document?</h3>
            <p className="mb-6 text-sm text-slate-400">
              "{confirmDelete.title}" aur uski storage file permanently delete hongi. Is document se judi findings ka source reference khaali ho jayega.
            </p>
            <div className="flex justify-end gap-3">
              <KbButton variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</KbButton>
              <KbButton variant="danger" onClick={() => void remove(confirmDelete)}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
              </KbButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { supabase } from '@/lib/supabase';

function supabaseUpload(userId: string, documentId: string, file: File) {
  return supabase.storage
    .from('kb-documents')
    .upload(`${userId}/${documentId}`, file, {
      cacheControl: '3600',
      upsert: true,
    });
}
