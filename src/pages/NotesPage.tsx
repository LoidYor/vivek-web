import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, FileText, Download, FolderOpen, Loader2, AlertCircle } from 'lucide-react';
import PageHeader, { PageSection } from '@/components/PageHeader';
import {
  CATEGORY_LABELS,
  fetchDownloadUrl,
  fetchMaterials,
  formatFileSize,
  type Material,
  type MaterialCategory,
} from '@/lib/materials';

type CategoryFilter = 'all' | MaterialCategory;

const categoryFilters: CategoryFilter[] = ['all', 'notes', 'pyq', 'assignment'];

const chipClass = (active: boolean) =>
  `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
    active
      ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
      : 'bg-ink-900 text-stone-400 border border-stone-800 hover:border-stone-700'
  }`;

export default function NotesPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
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
  }, []);

  const subjects = useMemo(() => {
    const counts = new Map<string, number>();
    materials.forEach((m) => counts.set(m.subject, (counts.get(m.subject) ?? 0) + 1));
    return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [materials]);

  const filtered = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(search.trim().toLowerCase()) &&
      (activeCategory === 'all' || m.category === activeCategory) &&
      (!activeSubject || m.subject === activeSubject),
  );

  const handleDownload = async (id: string) => {
    setDownloadError(null);
    setDownloadingId(id);
    try {
      const url = await fetchDownloadUrl(id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <PageHeader
        icon={BookOpen}
        title="Notes"
        subtitle="Your knowledge library"
        description="Access organized study notes, previous year papers and assignments, all in one searchable place."
        accent="#fbbf24"
      />
      <PageSection>
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-900 border border-stone-800 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          {categoryFilters.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={chipClass(activeCategory === category)}
            >
              {category === 'all' ? 'All Types' : CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        {subjects.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-10">
            <button onClick={() => setActiveSubject(null)} className={chipClass(!activeSubject)}>
              All Subjects
            </button>
            {subjects.map((s) => (
              <button
                key={s.name}
                onClick={() => setActiveSubject(s.name)}
                className={chipClass(activeSubject === s.name)}
              >
                {s.name} ({s.count})
              </button>
            ))}
          </div>
        )}

        {downloadError && (
          <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {downloadError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-stone-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading materials...
          </div>
        ) : loadError ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-red-400/70 mx-auto mb-4" />
            <p className="text-stone-400">{loadError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-stone-700 mx-auto mb-4" />
            <p className="text-stone-500">
              {materials.length === 0 ? 'No materials have been uploaded yet.' : 'No materials match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((material, i) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.05 }}
                className="group flex flex-col p-5 rounded-2xl bg-ink-900 border border-stone-800 hover:border-gold-500/30 transition-colors"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-gold-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-stone-100 group-hover:text-gold-300 transition-colors break-words">
                      {material.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {material.subject} · {CATEGORY_LABELS[material.category]}
                    </p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 text-xs text-stone-600">
                  <span>
                    {new Date(material.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} ·{' '}
                    {formatFileSize(material.size_bytes)}
                  </span>
                  <button
                    onClick={() => handleDownload(material.id)}
                    disabled={downloadingId === material.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-300 bg-stone-800/60 hover:bg-gold-500/20 hover:text-gold-300 disabled:opacity-60 transition-colors"
                  >
                    {downloadingId === material.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Download
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </PageSection>
    </>
  );
}
