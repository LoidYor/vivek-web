import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Library,
  Sparkles,
  ListChecks,
  History,
  ArrowRightLeft,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Network,
  Loader2,
} from 'lucide-react';
import { KbAuthProvider, useKbAuth } from '@/kb/KbAuthContext';
import KbSignIn from '@/kb/KbSignIn';
import { supabase } from '@/lib/supabase';

const navItems = [
  { to: '/knowledgebridge', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/knowledgebridge/projects', label: 'Projects', icon: FolderKanban },
  { to: '/knowledgebridge/library', label: 'Knowledge Library', icon: Library },
  { to: '/knowledgebridge/analyzer', label: 'AI Analyzer', icon: Sparkles },
  { to: '/knowledgebridge/tasks', label: 'Tasks & Decisions', icon: ListChecks },
  { to: '/knowledgebridge/timeline', label: 'Timeline', icon: History },
  { to: '/knowledgebridge/handover', label: 'Handover Center', icon: ArrowRightLeft },
  { to: '/knowledgebridge/reports', label: 'Reports', icon: FileText },
  { to: '/knowledgebridge/settings', label: 'Settings', icon: Settings },
];

function Shell() {
  const { session, loading } = useKbAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!session) return <KbSignIn />;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800 bg-slate-900/80 backdrop-blur md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/10">
            <Network className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">KnowledgeBridge</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">AI Workspace</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-300">
              {(session.user.email ?? '?').slice(0, 1).toUpperCase()}
            </div>
            <p className="truncate text-xs text-slate-400">{session.user.email}</p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Back to VIVEK site
            </button>
            <button
              onClick={() => void supabase.auth.signOut()}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:text-rose-300 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* top bar - mobile */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold">KnowledgeBridge</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" className="p-2 text-slate-300">
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {menuOpen && (
        <div className="fixed inset-x-0 top-14 z-40 border-b border-slate-800 bg-slate-900/95 p-4 backdrop-blur md:hidden">
          <ul className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                      isActive ? 'bg-blue-500/10 text-blue-300' : 'text-slate-400'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                onClick={() => void supabase.auth.signOut()}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* main */}
      <main className="flex-1 px-4 pb-16 pt-20 md:ml-64 md:px-8 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function KbLayout() {
  return (
    <KbAuthProvider>
      <Shell />
    </KbAuthProvider>
  );
}
