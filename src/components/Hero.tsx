import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Moon, Sun } from 'lucide-react';

const roles = ['Student', 'Web Developer', 'Creator', 'Problem Solver', 'Learner'];

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export default function Hero() {
  const [now, setNow] = useState(new Date());
  const [roleIndex, setRoleIndex] = useState(0);
  const [lightMode, setLightMode] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const pullStart = useRef<number | null>(null);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const roleTimer = window.setInterval(() => {
      setRoleIndex((current) => (current + 1) % roles.length);
    }, 2000);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(roleTimer);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = lightMode ? 'light' : 'dark';
  }, [lightMode]);

  const startPull = (event: PointerEvent<HTMLButtonElement>): void => {
    pullStart.current = event.clientY;
    setIsPulling(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const movePull = (event: PointerEvent<HTMLButtonElement>): void => {
    if (pullStart.current === null) return;
    setPullDistance(Math.min(68, Math.max(0, event.clientY - pullStart.current)));
  };

  const finishPull = (event: PointerEvent<HTMLButtonElement>): void => {
    const distance = pullStart.current === null ? 0 : event.clientY - pullStart.current;
    if (distance > 34 || distance < 8) setLightMode((current) => !current);
    pullStart.current = null;
    setIsPulling(false);
    setPullDistance(0);
  }; 

  const cancelPull = (): void => {
    pullStart.current = null;
    setIsPulling(false);
    setPullDistance(0);
  }; 

  return (
    <section className={`vivek-hero ${lightMode ? 'vivek-hero-light' : ''}`}>
      <div className="vivek-hero-noise" />
      <button
        type="button"
        className={`vivek-pull-cord ${isPulling ? 'vivek-pull-cord-active' : ''}`}
        style={{ '--pull-distance': `${pullDistance}px` } as CSSProperties}
        onPointerDown={startPull}
        onPointerMove={movePull}
        onPointerUp={finishPull}
        onPointerCancel={cancelPull}
        aria-label="Tap or pull down to toggle light and dark theme"
      >
        <span className="vivek-cord" />
        <span className="vivek-cord-knob">{lightMode ? <Moon /> : <Sun />}</span>
      </button>

      <div className="vivek-hero-content container-vivek">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="vivek-intro"
        >
          <p className="vivek-eyebrow"><span /> Independent Student</p>
          <h1>Hi, I&apos;m Vivek.</h1>
          <p className="vivek-secondary-title">I am a</p>

          <div className="vivek-role-wrap" aria-live="polite">
            <div className="vivek-role-rings" aria-hidden="true">
              {Array.from({ length: 11 }, (_, index) => <span key={index} />)}
            </div>
            <div className="vivek-role-paper">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={roles[roleIndex]}
                  initial={{ rotateX: -88, opacity: 0, y: -8 }}
                  animate={{ rotateX: 0, opacity: 1, y: 0 }}
                  exit={{ rotateX: 88, opacity: 0, y: 8 }}
                  transition={{ duration: 0.58, ease: [0.22, 0.61, 0.36, 1] }}
                  className="vivek-role-text"
                >
                  {roles[roleIndex]}
                </motion.div>
              </AnimatePresence>
              <span className="vivek-role-count">{String(roleIndex + 1).padStart(2, '0')} / 05</span>
            </div>
            <div className="vivek-paper-shadow" />
          </div>

          <div className="vivek-actions">
            <Link to="/#doors" className="vivek-primary-action">
              Explore VIVEK <ArrowRight />
            </Link>
            <Link to="/#story" className="vivek-secondary-action">See my work</Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="vivek-photo-reserve"
          aria-label="Reserved space for Vivek's portrait"
        >
          <div className="vivek-photo-outline">
            <span>Portrait area</span>
          </div>
          <button type="button" className="vivek-ability-button" onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}>
            My ability card
          </button>
        </motion.div>
      </div>

      <div className="vivek-hero-footer container-vivek">
        <span>AVAILABLE FOR LEARNING &amp; BUILDING</span>
        <span>Local time&nbsp;&nbsp; <strong>{formatTime(now)}</strong>&nbsp;&nbsp; · &nbsp;&nbsp;{formatDate(now)}</span>
        <span>SCROLL TO EXPLORE ↓</span>
      </div>
    </section>
  );
}
