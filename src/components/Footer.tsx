import { Link } from 'react-router-dom';
import { Sparkles, Github, Twitter, Linkedin, Mail } from 'lucide-react';

const featureLinks = [
  { label: 'Notes', to: '/notes' },
  { label: 'Resume Studio', to: '/resume' },
  { label: 'Career Hub', to: '/career' },
  { label: 'AI Assistant', to: '/assistant' },
  { label: 'Planner', to: '/planner' },
  { label: 'LinkedIn Studio', to: '/linkedin' },
  { label: 'Learning Space', to: '/learning' },
  { label: 'My Projects', to: '/projects' },
];

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Explore VIVEK', to: '/#doors' },
  { label: 'Our Story', to: '/#story' },
  { label: 'Contact', to: '/#contact' },
];

export default function Footer() {
  return (
    <footer className="bg-ink-950 border-t border-stone-800/60 mt-24">
      <div className="container-vivek py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-ink-950" strokeWidth={2.5} />
              </span>
              <span className="font-display text-xl font-semibold text-stone-100">VIVEK</span>
            </Link>
            <p className="text-sm text-stone-500 leading-relaxed max-w-xs">
              Knowledge that makes you think. One space for everything a student needs to learn, build, and grow.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Navigation</h4>
            <ul className="space-y-2.5">
              {navLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-stone-400 hover:text-gold-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Features</h4>
            <ul className="space-y-2.5">
              {featureLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-stone-400 hover:text-gold-300 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-4">Connect</h4>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full border border-stone-700 flex items-center justify-center text-stone-400 hover:text-gold-300 hover:border-gold-500/50 transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <p className="text-xs text-stone-600 mt-6">Social links are placeholders.</p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-stone-800/60 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-stone-600">
            © {new Date().getFullYear()} VIVEK. All rights reserved.
          </p>
          <p className="text-xs text-stone-600 font-display italic">"Knowledge that makes you think."</p>
        </div>
      </div>
    </footer>
  );
}
