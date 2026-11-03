import { useEffect, useState } from 'react';
import { Trash2, Loader2, AlertCircle, FolderOpen } from 'lucide-react';
import {
  CATEGORY_LABELS,
  deleteMaterial,
  fetchMaterials,
  formatFileSize,
  type Material,
} from '@/lib/materials';

export default function MaterialsManager() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchMaterials()
      .then((rows) => {
        if (!cancelled) setMaterials(rows);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleDelete = async (id: string) => {
    setActionError(null);
    setDeletingId(id);
    try {
      await deleteMaterial(id);
      setConfirmingId(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="p-6 md:p-8 rounded-2xl bg-ink-900 border border-stone-800">
      <h2 className="font-display text-2xl text-stone-100 mb-6">Library ({materials.length})</h2>

      {actionError && (
        <p className="flex items-center gap-2 text-sm text-red-300 mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-3 py-10 text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading materials...
        </div>
      ) : loadError ? (
        <p className="flex items-center gap-2 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </p>
      ) : materials.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-10 h-10 text-stone-700 mx-auto mb-3" />
          <p className="text-stone-500">No materials yet. Upload your first one above.</p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-800">
          {materials.map((material) => (
            <li key={material.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-100 break-words">{material.title}</p>
                <p className="text-xs text-stone-500 mt-1">
                  {material.subject} · {CATEGORY_LABELS[material.category]} · {formatFileSize(material.size_bytes)}
                </p>
              </div>

              {confirmingId === material.id ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDelete(material.id)}
                    disabled={deletingId === material.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-200 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-60 transition-colors"
                  >
                    {deletingId === material.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Confirm delete
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    disabled={deletingId === material.id}
                    className="px-3 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingId(material.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-stone-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
