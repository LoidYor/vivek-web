/*
# Create materials library and admins tables

1. New Tables
- `admins`: list of user IDs allowed to upload and delete materials. `user_id` references the sign-in account; `created_at` records when access was granted.
- `materials`: one row per uploaded study file (notes, PYQs, assignments). Holds title, subject, category, original file name, MIME type, size, and the private storage object key and bucket it lives in.

2. Security
- Row level security enabled on both tables.
- `materials`: anonymous and signed-in visitors can read the catalog (intentionally public listing). No client write access; all writes go through the server function that checks admin status.
- `admins`: no client access at all. Only the server function (service role) reads it.
- The actual files are never public. They are served through short-lived signed download links issued by the server function.

3. Notes
- Writes to both tables use the service role inside the server function, which bypasses RLS by design after verifying the caller is an admin.
*/

CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 100),
  category text NOT NULL CHECK (category IN ('notes', 'pyq', 'assignment')),
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0),
  bucket text NOT NULL,
  object_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS materials_category_subject_idx ON materials (category, subject);
CREATE INDEX IF NOT EXISTS materials_created_at_idx ON materials (created_at DESC);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON materials TO anon, authenticated;

DROP POLICY IF EXISTS "public_select_materials" ON materials;
CREATE POLICY "public_select_materials" ON materials FOR SELECT
  TO anon, authenticated USING (true);
