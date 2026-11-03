import { supabase } from '@/lib/supabase';

export type MaterialCategory = 'notes' | 'pyq' | 'assignment';

export interface Material {
  id: string;
  title: string;
  subject: string;
  category: MaterialCategory;
  file_name: string;
  size_bytes: number;
  created_at: string;
}

export interface MaterialInput {
  title: string;
  subject: string;
  category: MaterialCategory;
  file: File;
}

export const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  notes: 'Notes',
  pyq: 'PYQs',
  assignment: 'Assignments',
};

export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
].join(',');

const GENERIC_ERROR = 'Something went wrong. Please try again.';

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export async function fetchMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('id, title, subject, category, file_name, size_bytes, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Could not load materials right now.');
  return (data ?? []) as Material[];
}

async function invokeMaterials<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('materials', {
    body: { action, ...payload },
  });

  if (error) {
    const response = (error as { context?: unknown }).context;
    const body = response instanceof Response ? await response.json().catch(() => null) : null;
    throw new Error(typeof body?.error === 'string' ? body.error : GENERIC_ERROR);
  }

  if (!data || typeof data !== 'object') throw new Error(GENERIC_ERROR);
  return data as T;
}

export async function fetchIsAdmin(): Promise<boolean> {
  const result = await invokeMaterials<{ isAdmin: boolean }>('status');
  return result.isAdmin === true;
}

export async function fetchDownloadUrl(id: string): Promise<string> {
  const result = await invokeMaterials<{ url: string }>('download', { id });
  if (typeof result.url !== 'string') throw new Error(GENERIC_ERROR);
  return result.url;
}

export async function uploadMaterial({ title, subject, category, file }: MaterialInput): Promise<void> {
  const { uploadUrl, objectKey } = await invokeMaterials<{ uploadUrl: string; objectKey: string }>(
    'createUpload',
    { title, subject, category, fileName: file.name, mimeType: file.type, sizeBytes: file.size },
  );

  const put = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  }).catch(() => null);
  if (!put?.ok) throw new Error('The file could not be uploaded. Check your connection and try again.');

  await invokeMaterials<{ id: string }>('register', {
    objectKey,
    title,
    subject,
    category,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });
}

export async function deleteMaterial(id: string): Promise<void> {
  await invokeMaterials<{ ok: boolean }>('delete', { id });
}
