import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowRight, BookMarked, Code, Brain, Database, Palette } from 'lucide-react';
import PageHeader, { PageSection } from '@/components/PageHeader';

const categories = [
  { name: 'Web Development', icon: Code, count: 12, color: '#fbbf24' },
  { name: 'AI & Machine Learning', icon: Brain, count: 8, color: '#f59e0b' },
  { name: 'Databases', icon: Database, count: 6, color: '#fb923c' },
  { name: 'Design & UI/UX', icon: Palette, count: 5, color: '#fbbf24' },
];

const paths = [
  {
    title: 'Full-Stack Developer Path',
    level: 'Beginner to Advanced',
    steps: ['HTML & CSS Fundamentals', 'JavaScript & React', 'Backend with Node.js', 'Databases & APIs', 'Deploy Your App'],
    color: '#fbbf24',
  },
  {
    title: 'Data Science Foundations',
    level: 'Intermediate',
    steps: ['Python for Data Science', 'Statistics & Probability', 'Pandas & NumPy', 'Data Visualization', 'ML Basics'],
    color: '#f59e0b',
  },
  {
    title: 'UI/UX Design Essentials',
    level: 'Beginner',
    steps: ['Design Principles', 'Figma Basics', 'Color & Typography', 'Prototyping', 'Portfolio Project'],
    color: '#fb923c',
  },
];

const resources = [
  { title: 'FreeCodeCamp — Full React Course', type: 'Video', duration: '12 hours' },
  { title: 'MDN Web Docs — CSS Flexbox Guide', type: 'Article', duration: '30 min' },
  { title: 'Kaggle — Intro to Machine Learning', type: 'Interactive', duration: '3 hours' },
  { title: 'Figma — Design Tutorial for Beginners', type: 'Video', duration: '45 min' },
  { title: 'Stanford — Database Mini-Course', type: 'Course', duration: '8 hours' },
  { title: 'Refactoring UI — Practical Design Tips', type: 'Book', duration: '2 hours' },
];

export default function LearningPage() {
  const [activePath, setActivePath] = useState(0);

  return (
    <>
      <PageHeader
        icon={GraduationCap}
        title="Learning Space"
        subtitle="Learn beyond the classroom"
        description="Discover learning paths, skill tracks, tutorials and curated educational resources to grow at your own pace."
        accent="#fbbf24"
      />
      <PageSection>
        {/* Categories */}
        <h2 className="font-display text-xl font-semibold text-stone-100 mb-4">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl bg-ink-900 border border-stone-800 hover:border-gold-500/30 transition-colors cursor-pointer group"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${cat.color}15` }}
              >
                <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
              </div>
              <h3 className="text-sm font-medium text-stone-100 group-hover:text-gold-300 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-stone-600 mt-1">{cat.count} resources</p>
            </motion.div>
          ))}
        </div>

        {/* Learning paths */}
        <h2 className="font-display text-xl font-semibold text-stone-100 mb-4">Learning Paths</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-12">
          {paths.map((path, i) => (
            <div
              key={path.title}
              onClick={() => setActivePath(i)}
              className={`p-5 rounded-2xl bg-ink-900 border transition-colors cursor-pointer ${
                activePath === i
                  ? 'border-gold-500/40 bg-gold-500/5'
                  : 'border-stone-800 hover:border-stone-700'
              }`}
            >
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full mb-3 inline-block"
                style={{ background: `${path.color}15`, color: path.color }}
              >
                {path.level}
              </span>
              <h3 className="text-sm font-medium text-stone-100 mb-3">{path.title}</h3>
              <div className="space-y-1.5">
                {path.steps.map((step, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs text-stone-500">
                    <span className="font-display font-semibold text-stone-600">{j + 1}.</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Resources */}
        <h2 className="font-display text-xl font-semibold text-stone-100 mb-4">Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((res, i) => (
            <motion.div
              key={res.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-5 rounded-2xl bg-ink-900 border border-stone-800 hover:border-gold-500/30 transition-colors group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <BookMarked className="w-5 h-5 text-gold-400" />
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                  {res.type}
                </span>
              </div>
              <h3 className="text-sm font-medium text-stone-100 group-hover:text-gold-300 transition-colors mb-2">
                {res.title}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-600">{res.duration}</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-600 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-stone-600 mt-8 text-center">
          Demo content — resources are sample entries, not live links.
        </p>
      </PageSection>
    </>
  );
}
