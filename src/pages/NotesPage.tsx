import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, FileText, Download, FolderOpen } from 'lucide-react';
import PageHeader, { PageSection } from '@/components/PageHeader';

const subjects = [
  { name: 'Computer Science', count: 24, color: '#fbbf24' },
  { name: 'Mathematics', count: 18, color: '#f59e0b' },
  { name: 'Physics', count: 12, color: '#fb923c' },
  { name: 'Electronics', count: 9, color: '#fbbf24' },
  { name: 'Management', count: 7, color: '#f59e0b' },
  { name: 'Humanities', count: 5, color: '#fb923c' },
];

const notes = [
  { title: 'Data Structures & Algorithms', subject: 'Computer Science', size: '2.4 MB', date: 'Oct 2026' },
  { title: 'Linear Algebra — Complete Notes', subject: 'Mathematics', size: '1.8 MB', date: 'Oct 2026' },
  { title: 'Digital Logic Design', subject: 'Electronics', size: '3.1 MB', date: 'Sep 2026' },
  { title: 'Quantum Physics Basics', subject: 'Physics', size: '4.2 MB', date: 'Sep 2026' },
  { title: 'Operating Systems', subject: 'Computer Science', size: '2.9 MB', date: 'Aug 2026' },
  { title: 'Probability & Statistics', subject: 'Mathematics', size: '1.5 MB', date: 'Aug 2026' },
];

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) &&
      (!activeSubject || n.subject === activeSubject)
  );

  return (
    <>
      <PageHeader
        icon={BookOpen}
        title="Notes"
        subtitle="Your knowledge library"
        description="Access organized study notes, PDFs, subject materials and learning resources — all in one searchable place."
        accent="#fbbf24"
      />
      <PageSection>
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-900 border border-stone-800 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Subject filters */}
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={() => setActiveSubject(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeSubject
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                : 'bg-ink-900 text-stone-400 border border-stone-800 hover:border-stone-700'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((s) => (
            <button
              key={s.name}
              onClick={() => setActiveSubject(s.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeSubject === s.name
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                  : 'bg-ink-900 text-stone-400 border border-stone-800 hover:border-stone-700'
              }`}
            >
              {s.name} ({s.count})
            </button>
          ))}
        </div>

        {/* Notes grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-stone-700 mx-auto mb-4" />
            <p className="text-stone-500">No notes found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((note, i) => (
              <motion.div
                key={note.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group p-5 rounded-2xl bg-ink-900 border border-stone-800 hover:border-gold-500/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-stone-100 group-hover:text-gold-300 transition-colors">
                      {note.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">{note.subject}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span>{note.date}</span>
                  <span className="flex items-center gap-1">
                    {note.size}
                    <Download className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <p className="text-xs text-stone-600 mt-8 text-center">
          Demo content — these are sample notes, not real files.
        </p>
      </PageSection>
    </>
  );
}
