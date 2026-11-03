import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const links = [
  { label: 'Home', to: '/' },
  { label: 'Notes', to: '/notes' },
  { label: 'Resume Studio', to: '/resume' },
  { label: 'Career Hub', to: '/career' },
  { label: 'My Story', to: '/#story' },
  { label: 'Contact', to: '/#contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [now, setNow] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    window.addEventListener('scroll', onScroll);
    return () => {
      window.clearInterval(clock);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`vivek-navbar fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'vivek-navbar-scrolled' : ''}`}
    >
      <nav className="container-vivek flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="vivek-nav-brand" aria-label="VIVEK home">
          VIVEK
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <li key={link.label}>
              <Link
                to={link.to}
                className="text-sm text-stone-400 hover:text-gold-300 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold-400 group-hover:w-full transition-all duration-300" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="vivek-nav-time" aria-label="Current local time">
          <span>Local time</span>
          <strong>{new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(now)}</strong>
          <i>·</i>
          <span>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(now)}</span>
        </div>

        <button
          className="md:hidden text-stone-200 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-ink-900/95 backdrop-blur-xl border-b border-stone-800"
          >
            <ul className="container-vivek py-6 flex flex-col gap-4">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-base text-stone-300 hover:text-gold-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
