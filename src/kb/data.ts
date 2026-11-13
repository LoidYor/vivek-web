import { supabase } from '@/lib/supabase';
import type {
  KbProject,
  KbDocument,
  KbFinding,
  KbTask,
  KbDecision,
  KbTimelineEvent,
  KbReport,
  EventType,
  FindingKind,
  FindingPayload,
  DocType,
  HandoverReport,
} from './types';

function message(err: { message: string } | null, fallback: string): string {
  return err?.message ?? fallback;
}

// ---------- projects ----------

export async function listProjects(): Promise<KbProject[]> {
  const { data, error } = await supabase
    .from('kb_projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(message(error, 'Projects load nahi hue'));
  return data ?? [];
}

export async function createProject(
  input: Pick<KbProject, 'name' | 'description' | 'objective' | 'team_name' | 'owner_name' | 'start_date' | 'target_date' | 'status'>,
): Promise<KbProject> {
  const { data, error } = await supabase
    .from('kb_projects')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(message(error, 'Project nahi bana'));
  await addEvent(data.id, 'project_created', `Project created: ${data.name}`, '', null);
  return data;
}

export async function updateProject(id: string, patch: Partial<KbProject>): Promise<void> {
  const { data: before } = await supabase
    .from('kb_projects')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  const { error } = await supabase.from('kb_projects').update(patch).eq('id', id);
  if (error) throw new Error(message(error, 'Project update nahi hua'));
  if (patch.status && before && before.status !== patch.status) {
    await addEvent(id, 'status_change', `Status changed to ${patch.status.replace('_', ' ')}`, '', null);
  }
}

export async function deleteProject(id: string): Promise<void> {
  const { data: docs } = await supabase
    .from('kb_documents')
    .select('storage_path')
    .eq('project_id', id);
  const { error } = await supabase.from('kb_projects').delete().eq('id', id);
  if (error) throw new Error(message(error, 'Project delete nahi hua'));
  const paths = (docs ?? []).map((d) => d.storage_path).filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    await supabase.storage.from('kb-documents').remove(paths);
  }
}

// ---------- documents ----------

export async function listDocuments(projectId: string): Promise<KbDocument[]> {
  const { data, error } = await supabase
    .from('kb_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(message(error, 'Documents load nahi hue'));
  return data ?? [];
}

export async function createDocument(input: {
  project_id: string;
  title: string;
  doc_type: DocType;
  storage_path?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  status?: 'uploaded' | 'processing' | 'processed' | 'failed';
  status_error?: string | null;
  extracted_text?: string;
}): Promise<KbDocument> {
  const { data, error } = await supabase
    .from('kb_documents')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(message(error, 'Document save nahi hua'));
  await addEvent(input.project_id, 'document_added', `Document added: ${data.title}`, '', data.id);
  return data;
}

export async function updateDocument(id: string, patch: Partial<KbDocument>): Promise<void> {
  const { error } = await supabase.from('kb_documents').update(patch).eq('id', id);
  if (error) throw new Error(message(error, 'Document update nahi hua'));
}

export async function deleteDocument(doc: KbDocument): Promise<void> {
  const { error } = await supabase.from('kb_documents').delete().eq('id', doc.id);
  if (error) throw new Error(message(error, 'Document delete nahi hua'));
  if (doc.storage_path) {
    await supabase.storage.from('kb-documents').remove([doc.storage_path]);
  }
}

export async function getDocumentFileUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase
    .storage
    .from('kb-documents')
    .createSignedUrl(storagePath, 300);
  if (error) throw new Error(message(error, 'File link nahi mili'));
  return data.signedUrl;
}

// ---------- findings ----------

export async function listFindings(projectId: string): Promise<KbFinding[]> {
  const { data, error } = await supabase
    .from('kb_findings')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(message(error, 'Findings load nahi hui'));
  return data ?? [];
}

export async function createFinding(input: {
  project_id: string;
  document_id: string | null;
  kind: FindingKind;
  payload: FindingPayload;
  origin: 'ai' | 'manual';
  analysis_id?: string | null;
}): Promise<KbFinding> {
  const { data, error } = await supabase
    .from('kb_findings')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(message(error, 'Finding save nahi hui'));
  return data;
}

export async function updateFinding(
  id: string,
  patch: Partial<Pick<KbFinding, 'payload' | 'review_state' | 'original_ai'>>,
): Promise<void> {
  const { error } = await supabase.from('kb_findings').update(patch).eq('id', id);
  if (error) throw new Error(message(error, 'Finding update nahi hui'));
}

export async function deleteFinding(id: string): Promise<void> {
  const { error } = await supabase.from('kb_findings').delete().eq('id', id);
  if (error) throw new Error(message(error, 'Finding delete nahi hui'));
}

// ---------- tasks ----------

export async function listTasks(projectId: string): Promise<KbTask[]> {
  const { data, error } = await supabase
    .from('kb_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(message(error, 'Tasks load nahi hue'));
  return data ?? [];
}

export async function createTask(input: {
  project_id: string;
  title: string;
  detail?: string;
  assignee?: string;
  priority?: string;
  status?: string;
  due_date?: string | null;
  depends_on_task_id?: string | null;
  document_id?: string | null;
  origin?: 'ai' | 'manual';
  linked_finding_id?: string | null;
}): Promise<KbTask> {
  const { data, error } = await supabase
    .from('kb_tasks')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(message(error, 'Task save nahi hua'));
  await addEvent(input.project_id, 'task_created', `Task created: ${data.title}`, '', input.document_id ?? null);
  return data;
}

export async function updateTask(id: string, patch: Partial<KbTask>): Promise<void> {
  const { data: before } = await supabase
    .from('kb_tasks')
    .select('status, project_id, title, document_id')
    .eq('id', id)
    .maybeSingle();
  const { error } = await supabase.from('kb_tasks').update(patch).eq('id', id);
  if (error) throw new Error(message(error, 'Task update nahi hua'));
  if (before && patch.status === 'completed' && before.status !== 'completed') {
    await addEvent(before.project_id, 'task_completed', `Task completed: ${before.title}`, '', before.document_id);
  }
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('kb_tasks').delete().eq('id', id);
  if (error) throw new Error(message(error, 'Task delete nahi hua'));
}

// ---------- decisions ----------

export async function listDecisions(projectId: string): Promise<KbDecision[]> {
  const { data, error } = await supabase
    .from('kb_decisions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(message(error, 'Decisions load nahi hue'));
  return data ?? [];
}

export async function createDecision(input: {
  project_id: string;
  title: string;
  rationale?: string;
  decided_on?: string | null;
  origin?: 'ai' | 'manual';
  document_id?: string | null;
  linked_finding_id?: string | null;
}): Promise<KbDecision> {
  const { data, error } = await supabase
    .from('kb_decisions')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(message(error, 'Decision save nahi hua'));
  await addEvent(input.project_id, 'decision', `Decision recorded: ${data.title}`, '', input.document_id ?? null);
  return data;
}

export async function updateDecision(id: string, patch: Partial<KbDecision>): Promise<void> {
  const { error } = await supabase.from('kb_decisions').update(patch).eq('id', id);
  if (error) throw new Error(message(error, 'Decision update nahi hua'));
}

export async function deleteDecision(id: string): Promise<void> {
  const { error } = await supabase.from('kb_decisions').delete().eq('id', id);
  if (error) throw new Error(message(error, 'Decision delete nahi hua'));
}

// ---------- timeline ----------

export async function addEvent(
  projectId: string,
  eventType: EventType,
  title: string,
  detail: string,
  documentId: string | null,
  occurredOn?: string | null,
): Promise<void> {
  const { error } = await supabase.from('kb_timeline_events').insert({
    project_id: projectId,
    event_type: eventType,
    title,
    detail,
    document_id: documentId,
    occurred_on: occurredOn ?? null,
  });
  if (error) throw new Error(message(error, 'Timeline event save nahi hua'));
}

export async function listEvents(projectId: string): Promise<KbTimelineEvent[]> {
  const { data, error } = await supabase
    .from('kb_timeline_events')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(message(error, 'Timeline load nahi hua'));
  return data ?? [];
}

// ---------- reports ----------

export async function saveReport(projectId: string, title: string, report: HandoverReport): Promise<KbReport> {
  const { data, error } = await supabase
    .from('kb_reports')
    .insert({ project_id: projectId, title, report })
    .select()
    .single();
  if (error) throw new Error(message(error, 'Report save nahi hui'));
  return data;
}

export async function listReports(projectId: string): Promise<KbReport[]> {
  const { data, error } = await supabase
    .from('kb_reports')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(message(error, 'Reports load nahi hui'));
  return data ?? [];
}

export async function deleteReportRow(id: string): Promise<void> {
  const { error } = await supabase.from('kb_reports').delete().eq('id', id);
  if (error) throw new Error(message(error, 'Report delete nahi hui'));
}
