export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';

export interface KbProject {
  id: string;
  name: string;
  description: string;
  objective: string;
  team_name: string;
  owner_name: string;
  start_date: string | null;
  target_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export type DocType = 'pdf' | 'txt' | 'md' | 'meeting_note' | 'description';
export type DocStatus = 'uploaded' | 'processing' | 'processed' | 'failed';

export interface KbDocument {
  id: string;
  project_id: string;
  title: string;
  doc_type: DocType;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  status: DocStatus;
  status_error: string | null;
  extracted_text: string;
  created_at: string;
}

export type FindingKind =
  | 'decision'
  | 'completed_task'
  | 'pending_task'
  | 'risk'
  | 'dependency'
  | 'question';

export interface FindingPayload {
  title: string;
  detail?: string;
  evidence?: string;
  rationale?: string;
  decided_on?: string | null;
}

export type ReviewState = 'pending' | 'approved' | 'rejected' | 'edited';
export type Origin = 'ai' | 'manual';

export interface KbFinding {
  id: string;
  project_id: string;
  document_id: string | null;
  kind: FindingKind;
  payload: FindingPayload;
  origin: Origin;
  review_state: ReviewState;
  original_ai: FindingPayload | null;
  analysis_id: string | null;
  created_at: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface KbTask {
  id: string;
  project_id: string;
  title: string;
  detail: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  depends_on_task_id: string | null;
  document_id: string | null;
  origin: Origin;
  linked_finding_id: string | null;
  created_at: string;
}

export interface KbDecision {
  id: string;
  project_id: string;
  title: string;
  rationale: string;
  decided_on: string | null;
  review_state: ReviewState;
  origin: Origin;
  document_id: string | null;
  linked_finding_id: string | null;
  created_at: string;
}

export type EventType =
  | 'project_created'
  | 'document_added'
  | 'decision'
  | 'task_created'
  | 'task_completed'
  | 'status_change'
  | 'analysis_run'
  | 'approved_knowledge';

export interface KbTimelineEvent {
  id: string;
  project_id: string;
  event_type: EventType;
  title: string;
  detail: string;
  occurred_on: string | null;
  document_id: string | null;
  created_at: string;
}

export interface HandoverReport {
  generatedAt: string;
  project: {
    name: string;
    description: string;
    objective: string;
    teamName: string;
    ownerName: string;
    status: string;
    startDate: string | null;
    targetDate: string | null;
  };
  approvedDecisions: { title: string; rationale: string; decidedOn: string | null; source: string | null }[];
  completedTasks: { title: string; assignee: string; source: string | null }[];
  pendingTasks: { title: string; assignee: string; priority: string; dueDate: string | null; source: string | null }[];
  blockedTasks: { title: string; assignee: string; source: string | null }[];
  approvedRisks: { title: string; detail: string; source: string | null }[];
  approvedDependencies: { title: string; detail: string; source: string | null }[];
  openQuestions: { title: string; detail: string; source: string | null }[];
  documents: { title: string; type: string; addedOn: string }[];
  missingInfo: string[];
}

export interface KbReport {
  id: string;
  project_id: string;
  title: string;
  report: HandoverReport;
  created_at: string;
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  archived: 'Archived',
};

export const FINDING_KIND_LABELS: Record<FindingKind, string> = {
  decision: 'Decision',
  completed_task: 'Completed Task',
  pending_task: 'Pending Task',
  risk: 'Risk',
  dependency: 'Dependency',
  question: 'Open Question',
};

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  pdf: 'PDF',
  txt: 'Text',
  md: 'Markdown',
  meeting_note: 'Meeting Note',
  description: 'Description',
};
