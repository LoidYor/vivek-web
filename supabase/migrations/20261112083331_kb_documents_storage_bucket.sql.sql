/*
# KnowledgeBridge AI — documents storage bucket

1. Purpose
   Private storage bucket `kb-documents` holds uploaded project documents
   (PDF/TXT/MD) for KnowledgeBridge AI. Files stay in storage even after
   text extraction, so the original document is always preserved and can
   be opened from the Knowledge Library.

2. Security
   - Bucket is PRIVATE. Browser access goes through signed URLs.
   - Storage RLS: a user can only read/write files under their own
     `user_id/` folder prefix. The path convention `{user_id}/{document_id}`
     is enforced by the policy's filename expression.
   - Grant to authenticated only.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('kb-documents', 'kb-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "kb_documents_owner_read" ON storage.objects;
CREATE POLICY "kb_documents_owner_read" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kb-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "kb_documents_owner_write" ON storage.objects;
CREATE POLICY "kb_documents_owner_write" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kb-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "kb_documents_owner_delete" ON storage.objects;
CREATE POLICY "kb_documents_owner_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'kb-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
