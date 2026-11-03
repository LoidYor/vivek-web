import { useState, type FormEvent } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  ACCEPTED_FILE_TYPES,
  CATEGORY_LABELS,
  uploadMaterial,
  type MaterialCategory,
} from '@/lib/materials';
import { adminInputClass, adminPrimaryButtonClass } from '@/components/admin/adminStyles';

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const categories: MaterialCategory[] = ['notes', 'pyq', 'assignment'];

interface MaterialUploadFormProps {
  onUploaded: () => void;
}

export default function MaterialUploadForm({ onUploaded }: MaterialUploadFormProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('notes');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('That file is larger than 50 MB.');
      return;
    }

    const form = e.currentTarget;
    setSubmitting(true);
    try {
      await uploadMaterial({ title: title.trim(), subject: subject.trim(), category, file });
      setSuccess(`"${title.trim()}" is now available in the library.`);
      setTitle('');
      setSubject('');
      setFile(null);
      form.reset();
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-2xl bg-ink-900 border border-stone-800">
      <h2 className="font-display text-2xl text-stone-100 mb-6">Upload a new material</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="flex flex-col gap-2 text-sm text-stone-400">
          Title
          <input
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Operating Systems Unit 2"
            className={adminInputClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-stone-400">
          Subject
          <input
            type="text"
            required
            maxLength={100}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Computer Science"
            className={adminInputClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-stone-400">
          Type
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MaterialCategory)}
            className={adminInputClass}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-stone-400">
          File (PDF, Word, PowerPoint, PNG or JPEG, up to 50 MB)
          <input
            type="file"
            required
            accept={ACCEPTED_FILE_TYPES}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-stone-400 file:mr-4 file:px-4 file:py-3 file:rounded-xl file:border-0 file:bg-stone-800 file:text-stone-200 hover:file:bg-stone-700 file:cursor-pointer"
          />
        </label>
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-300 mt-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 text-sm text-gold-300 mt-6">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {success}
        </p>
      )}

      <div className="mt-8 flex justify-end">
        <button type="submit" disabled={submitting} className={adminPrimaryButtonClass}>
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {submitting ? 'Uploading...' : 'Upload material'}
        </button>
      </div>
    </form>
  );
}
