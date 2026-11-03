import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Check, Clock, Circle } from 'lucide-react';
import PageHeader, { PageSection } from '@/components/PageHeader';

interface Task {
  id: number;
  title: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
}

const initialTasks: Task[] = [
  { id: 1, title: 'Complete Data Structures assignment', date: 'Today', priority: 'high', done: false },
  { id: 2, title: 'Review Linear Algebra notes', date: 'Today', priority: 'medium', done: false },
  { id: 3, title: 'Update resume with new project', date: 'Tomorrow', priority: 'medium', done: true },
  { id: 4, title: 'Register for HackTheFuture', date: 'Nov 30', priority: 'high', done: false },
  { id: 5, title: 'Read chapter 5 — Operating Systems', date: 'Nov 10', priority: 'low', done: true },
];

const priorityColors = {
  high: '#fbbf24',
  medium: '#f59e0b',
  low: '#fb923c',
};

export default function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTitle, setNewTitle] = useState('');

  const toggle = (id: number) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const addTask = () => {
    if (!newTitle.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), title: newTitle, date: 'Today', priority: 'medium', done: false },
    ]);
    setNewTitle('');
  };

  const completed = tasks.filter((t) => t.done).length;
  const progress = Math.round((completed / tasks.length) * 100) || 0;

  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const today = 3;

  return (
    <>
      <PageHeader
        icon={Calendar}
        title="Planner"
        subtitle="Make every day count"
        description="Organize tasks, academic goals, deadlines and personal schedules — a clean dashboard for your daily productivity."
        accent="#f59e0b"
      />
      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task list */}
          <div className="lg:col-span-2">
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                placeholder="Add a new task..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                className="flex-1 px-4 py-3 rounded-xl bg-ink-900 border border-stone-800 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors"
              />
              <button
                onClick={addTask}
                className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-ink-950 hover:scale-105 transition-transform"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-ink-900 border border-stone-800 hover:border-stone-700 transition-colors"
                >
                  <button
                    onClick={() => toggle(task.id)}
                    className="flex-shrink-0"
                    aria-label="Toggle task"
                  >
                    {task.done ? (
                      <div className="w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-ink-950" strokeWidth={3} />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-stone-600" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        task.done ? 'text-stone-600 line-through' : 'text-stone-200'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-stone-600">
                        <Clock className="w-3 h-3" />
                        {task.date}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${priorityColors[task.priority]}15`,
                          color: priorityColors[task.priority],
                        }}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar: progress + calendar */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-ink-900 border border-stone-800">
              <h3 className="text-xs font-medium uppercase tracking-widest text-stone-500 mb-4">
                Today's Progress
              </h3>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#292524" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${progress * 2.51} ${251 - progress * 2.51}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-xl font-semibold text-stone-100">
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-stone-500">
                {completed} of {tasks.length} tasks completed
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-ink-900 border border-stone-800">
              <h3 className="text-xs font-medium uppercase tracking-widest text-stone-500 mb-4">
                November 2026
              </h3>
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {days.map((d) => (
                  <div
                    key={d}
                    className={`aspect-square flex items-center justify-center text-xs rounded-lg ${
                      d === today
                        ? 'bg-gold-500 text-ink-950 font-semibold'
                        : 'text-stone-500 hover:bg-ink-800'
                    } transition-colors cursor-pointer`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-stone-600 mt-8 text-center">
          Demo interface — tasks are stored in memory only and reset on page reload.
        </p>
      </PageSection>
    </>
  );
}
