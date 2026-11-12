/*
# KnowledgeBridge AI — core workspace tables

1. Purpose
   KnowledgeBridge AI is a separate product workspace inside this project.
   It stores projects, their documents, extracted text, AI findings
   (decisions, tasks, risks, dependencies, questions), timeline events and
   generated handover reports. It is fully separate from the existing
   VIVEK materials tables.

2. New Tables
   - `kb_projects` — a project workspace: name, description, objective,
     team, owner label, dates, status (planning/active/on_hold/completed/archived).
   - `kb_documents` — uploaded or manually added documents per project:
     name, type (pdf/txt/md/meeting_note/description), storage path,
     processing status (uploaded/processing/processed/failed), extracted text.
   - `kb_findings` — structured findings produced by AI analysis or manual
     entry. Kind: decision/completed_task/pending_task/risk/dependency/question.
     Each has review state (pending/approved/rejected/edited), origin
     (ai/manual), source document reference and a quote from the source.
   - `kb_tasks` — actionable tasks with priority, status, assignee, due date,
     dependency on another task, source document, origin (ai/manual).
   - `kb_decisions` — decisions with rationale, date if known, review state,
     source document, origin (ai/manual).
   - `kb_timeline_events` — chronological events with a type
     (document_added/decision/task_created/task_completed/status_change/analysis_run/project_created)
     and optional source document reference.
   - `kb_reports` — generated handover report snapshots stored as JSON with
     the generation date and the generating user.
   - `kb_profiles` — per-user workspace settings (display name, AI mode
     preference), one row per authenticated user.

3. Design notes
   - All rows are owned by a user: `user_id uuid NOT NULL DEFAULT auth.uid()`.
     Users can only ever see and touch their own rows (enforced by RLS).
   - `kb_findings.payload` holds the kind-specific fields (title, detail,
     evidence quote, confidence) as JSON so one table serves all finding types.
   - Foreign keys cascade on delete so deleting a project cleans up its
     documents, findings, tasks, decisions, events and reports.

4. Security
   - RLS enabled on every table.
   - All policies scoped TO authenticated with `auth.uid() = user_id`.
   - Full CRUD granted to authenticated only; service_role also granted for
     the analysis edge function.
*/

-- ============ projects ============
CREATE TABLE IF NOT EXISTS kb_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  objective text NOT NULL DEFAULT '',
  team_name text NOT NULL DEFAULT '',
  owner_name text NOT NULL DEFAULT '',
  start_date date,
  target_date date,
  status text NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning','active','on_hold','completed','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ documents ============
CREATE TABLE IF NOT EXISTS kb_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'txt'
    CHECK (doc_type IN ('pdf','txt','md','meeting_note','description')),
  storage_path text,
  mime_type text,
  size_bytes bigint,
  status text NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded','processing','processed','failed')),
  status_error text,
  extracted_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ findings (AI + manual, all kinds) ============
CREATE TABLE IF NOT EXISTS kb_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  document_id uuid REFERENCES kb_documents(id) ON DELETE SET NULL,
  kind text NOT NULL
    CHECK (kind IN ('decision','completed_task','pending_task','risk','dependency','question')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  origin text NOT NULL DEFAULT 'ai' CHECK (origin IN ('ai','manual')),
  review_state text NOT NULL DEFAULT 'pending'
    CHECK (review_state IN ('pending','approved','rejected','edited')),
  original_ai jsonb,
  analysis_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ tasks ============
CREATE TABLE IF NOT EXISTS kb_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  assignee text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low','medium','high','critical')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','completed','blocked')),
  due_date date,
  depends_on_task_id uuid REFERENCES kb_tasks(id) ON DELETE SET NULL,
  document_id uuid REFERENCES kb_documents(id) ON DELETE SET NULL,
  origin text NOT NULL DEFAULT 'manual' CHECK (origin IN ('ai','manual')),
  linked_finding_id uuid REFERENCES kb_findings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ decisions ============
CREATE TABLE IF NOT EXISTS kb_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  rationale text NOT NULL DEFAULT '',
  decided_on date,
  review_state text NOT NULL DEFAULT 'pending'
    CHECK (review_state IN ('pending','approved','rejected','edited')),
  origin text NOT NULL DEFAULT 'manual' CHECK (origin IN ('ai','manual')),
  document_id uuid REFERENCES kb_documents(id) ON DELETE SET NULL,
  linked_finding_id uuid REFERENCES kb_findings(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ timeline events ============
CREATE TABLE IF NOT EXISTS kb_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type IN ('project_created','document_added','decision','task_created','task_completed','status_change','analysis_run','approved_knowledge')),
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  occurred_on date,
  document_id uuid REFERENCES kb_documents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ reports ============
CREATE TABLE IF NOT EXISTS kb_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES kb_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ profiles ============
CREATE TABLE IF NOT EXISTS kb_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid(),
  display_name text NOT NULL DEFAULT '',
  ai_mode text NOT NULL DEFAULT 'auto' CHECK (ai_mode IN ('auto','demo')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ indexes ============
CREATE INDEX IF NOT EXISTS idx_kb_documents_project ON kb_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_kb_findings_project ON kb_findings(project_id);
CREATE INDEX IF NOT EXISTS idx_kb_findings_kind ON kb_findings(kind);
CREATE INDEX IF NOT EXISTS idx_kb_findings_review ON kb_findings(review_state);
CREATE INDEX IF NOT EXISTS idx_kb_tasks_project ON kb_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_kb_tasks_status ON kb_tasks(status);
CREATE INDEX IF NOT EXISTS idx_kb_decisions_project ON kb_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_kb_timeline_project ON kb_timeline_events(project_id);
CREATE INDEX IF NOT EXISTS idx_kb_reports_project ON kb_reports(project_id);

-- ============ updated_at triggers ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['kb_projects','kb_documents','kb_findings','kb_tasks','kb_decisions'] LOOP
    EXECUTE format('CREATE OR REPLACE FUNCTION kb_touch_%s() RETURNS trigger AS $fn$ BEGIN NEW.updated_at = now(); RETURN NEW; END $fn$ LANGUAGE plpgsql', t);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_kb_touch_%s ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_kb_touch_%s BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION kb_touch_%s()', t, t, t);
  END LOOP;
END $$;

-- ============ RLS ============
ALTER TABLE kb_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON kb_projects, kb_documents, kb_findings, kb_tasks, kb_decisions, kb_timeline_events, kb_reports, kb_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON kb_projects, kb_documents, kb_findings, kb_tasks, kb_decisions, kb_timeline_events, kb_reports, kb_profiles TO service_role;

-- projects: full owner CRUD
DROP POLICY IF EXISTS "kb_projects_select_own" ON kb_projects;
CREATE POLICY "kb_projects_select_own" ON kb_projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_projects_insert_own" ON kb_projects;
CREATE POLICY "kb_projects_insert_own" ON kb_projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_projects_update_own" ON kb_projects;
CREATE POLICY "kb_projects_update_own" ON kb_projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_projects_delete_own" ON kb_projects;
CREATE POLICY "kb_projects_delete_own" ON kb_projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- documents: owner CRUD via user_id (denormalized for simple, fast policies)
DROP POLICY IF EXISTS "kb_documents_select_own" ON kb_documents;
CREATE POLICY "kb_documents_select_own" ON kb_documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_documents_insert_own" ON kb_documents;
CREATE POLICY "kb_documents_insert_own" ON kb_documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_documents_update_own" ON kb_documents;
CREATE POLICY "kb_documents_update_own" ON kb_documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_documents_delete_own" ON kb_documents;
CREATE POLICY "kb_documents_delete_own" ON kb_documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- findings: owner CRUD via user_id
DROP POLICY IF EXISTS "kb_findings_select_own" ON kb_findings;
CREATE POLICY "kb_findings_select_own" ON kb_findings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_findings_insert_own" ON kb_findings;
CREATE POLICY "kb_findings_insert_own" ON kb_findings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_findings_update_own" ON kb_findings;
CREATE POLICY "kb_findings_update_own" ON kb_findings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_findings_delete_own" ON kb_findings;
CREATE POLICY "kb_findings_delete_own" ON kb_findings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- tasks: owner CRUD via user_id
DROP POLICY IF EXISTS "kb_tasks_select_own" ON kb_tasks;
CREATE POLICY "kb_tasks_select_own" ON kb_tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_tasks_insert_own" ON kb_tasks;
CREATE POLICY "kb_tasks_insert_own" ON kb_tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_tasks_update_own" ON kb_tasks;
CREATE POLICY "kb_tasks_update_own" ON kb_tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_tasks_delete_own" ON kb_tasks;
CREATE POLICY "kb_tasks_delete_own" ON kb_tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- decisions: owner CRUD via user_id
DROP POLICY IF EXISTS "kb_decisions_select_own" ON kb_decisions;
CREATE POLICY "kb_decisions_select_own" ON kb_decisions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_decisions_insert_own" ON kb_decisions;
CREATE POLICY "kb_decisions_insert_own" ON kb_decisions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_decisions_update_own" ON kb_decisions;
CREATE POLICY "kb_decisions_update_own" ON kb_decisions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_decisions_delete_own" ON kb_decisions;
CREATE POLICY "kb_decisions_delete_own" ON kb_decisions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- timeline: owner CRUD via user_id
DROP POLICY IF EXISTS "kb_timeline_select_own" ON kb_timeline_events;
CREATE POLICY "kb_timeline_select_own" ON kb_timeline_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_timeline_insert_own" ON kb_timeline_events;
CREATE POLICY "kb_timeline_insert_own" ON kb_timeline_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_timeline_update_own" ON kb_timeline_events;
CREATE POLICY "kb_timeline_update_own" ON kb_timeline_events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_timeline_delete_own" ON kb_timeline_events;
CREATE POLICY "kb_timeline_delete_own" ON kb_timeline_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- reports: owner CRUD via user_id
DROP POLICY IF EXISTS "kb_reports_select_own" ON kb_reports;
CREATE POLICY "kb_reports_select_own" ON kb_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_reports_insert_own" ON kb_reports;
CREATE POLICY "kb_reports_insert_own" ON kb_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_reports_delete_own" ON kb_reports;
CREATE POLICY "kb_reports_delete_own" ON kb_reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- profiles: owner select/update/insert; delete via cascade on auth user
DROP POLICY IF EXISTS "kb_profiles_select_own" ON kb_profiles;
CREATE POLICY "kb_profiles_select_own" ON kb_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_profiles_insert_own" ON kb_profiles;
CREATE POLICY "kb_profiles_insert_own" ON kb_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "kb_profiles_update_own" ON kb_profiles;
CREATE POLICY "kb_profiles_update_own" ON kb_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
