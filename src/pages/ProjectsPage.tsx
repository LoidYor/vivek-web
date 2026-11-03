import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderGit2, Plus, X, Github, ExternalLink, Star } from 'lucide-react';
import PageHeader, { PageSection } from '@/components/PageHeader';

interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  stars: number;
  status: 'active' | 'completed' | 'planning';
}

const initialProjects: Project[] = [
  {
    id: 1,
    title: 'VIVEK Platform',
    description: 'An AI-powered student learning and productivity platform. Built with React, TypeScript, and Tailwind CSS.',
    tags: ['React', 'TypeScript', 'Tailwind'],
    stars: 24,
    status: 'active',
  },
  {
    id: 2,
    title: 'Study Buddy Chatbot',
    description: 'A conversational AI assistant for students to ask questions and get study help.',
    tags: ['Python', 'NLP', 'Flask'],
    stars: 12,
    status: 'completed',
  },
  {
    id: 3,
    title: 'Campus Event Finder',
    description: 'A web app to discover and track campus events, hackathons, and workshops.',
    tags: ['Next.js', 'Supabase', 'Tailwind'],
    stars: 8,
    status: 'completed',
  },
  {
    id: 4,
    title: 'Smart Notes Organizer',
    description: 'Automatically categorize and tag study notes using ML. Currently in planning phase.',
    tags: ['ML', 'Python', 'Planning'],
    stars: 0,
    status: 'planning',
  },
];

const statusColors = {
  active: '#fbbf24',
  completed: '#f59e0b',
  planning: '#fb923c',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showAdd, setShowAdd] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', tags: '' });

  const addProject = () => {
    if (!newProject.title.trim()) return;
    setProjects((prev) => [
      {
        id: Date.now(),
        title: newProject.title,
        description: newProject.description || 'No description yet.',
        tags: newProject.tags ? newProject.tags.split(',').map((t) => t.trim()) : [],
        stars: 0,
        status: 'planning' as const,
      },
      ...prev,
    ]);
    setNewProject({ title: '', description: '', tags: '' });
    setShowAdd(false);
  };

  return (
    <>
      <PageHeader
        icon={FolderGit2}
        title="My Projects"
        subtitle="Turn ideas into reality"
        description="Showcase, organize and manage your personal and academic projects in one clean gallery."
        accent="#f59e0b"
      />
      <PageSection>
        <div className="flex justify-between items-center mb-8">
          <p className="text-sm text-stone-500">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 text-ink-950 text-sm font-medium shadow-lg shadow-gold-600/20 hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-2xl bg-ink-900 border border-stone-800 hover:border-gold-500/30 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5 text-gold-400" />
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    background: `${statusColors[project.status]}15`,
                    color: statusColors[project.status],
                  }}
                >
                  {project.status}
                </span>
              </div>
              <h3 className="text-base font-medium text-stone-100 group-hover:text-gold-300 transition-colors mb-2">
                {project.title}
              </h3>
              <p className="text-sm text-stone-400 leading-relaxed mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-ink-950 border border-stone-800 text-stone-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                <span className="flex items-center gap-1 text-xs text-stone-600">
                  <Star className="w-3.5 h-3.5" />
                  {project.stars}
                </span>
                <div className="flex gap-3">
                  <button className="text-stone-600 hover:text-gold-400 transition-colors" aria-label="GitHub link">
                    <Github className="w-4 h-4" />
                  </button>
                  <button className="text-stone-600 hover:text-gold-400 transition-colors" aria-label="External link">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Add project modal */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-3xl bg-ink-900 border border-stone-800 shadow-2xl p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display text-xl font-semibold text-stone-100">Add a Project</h3>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="text-stone-500 hover:text-stone-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Project title"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-ink-950 border border-stone-800 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors"
                  />
                  <textarea
                    placeholder="Project description"
                    rows={3}
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-ink-950 border border-stone-800 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors resize-none"
                  />
                  <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={newProject.tags}
                    onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-ink-950 border border-stone-800 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={addProject}
                    className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-ink-950 font-medium text-sm shadow-lg shadow-gold-600/20 hover:shadow-xl transition-all"
                  >
                    Add Project
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-xs text-stone-600 mt-8 text-center">
          Demo interface — projects are stored in memory only and reset on page reload.
        </p>
      </PageSection>
    </>
  );
}
