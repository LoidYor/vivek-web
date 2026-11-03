import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { type DoorFeature } from '@/data/doors';

interface DoorProps {
  feature: DoorFeature;
  index: number;
  panelSide: 'left' | 'right';
  isActive: boolean;
  isDimmed: boolean;
  onActiveChange: (active: boolean) => void;
}

export default function Door({ feature, index, panelSide, isActive, isDimmed, onActiveChange }: DoorProps) {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);

  const handleActivate = (): void => {
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => navigate(feature.route), 800);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate();
    }
  };

  const isOpen = isActive || opening;

  return (
    <div className={`vivek-door-column ${isDimmed ? 'vivek-door-column-dimmed' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: index * 0.08 }}
        role="button"
        tabIndex={0}
        aria-label={`Enter ${feature.title}`}
        onMouseEnter={() => onActiveChange(true)}
        onMouseLeave={() => onActiveChange(false)}
        onFocus={() => onActiveChange(true)}
        onBlur={() => onActiveChange(false)}
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        className={`vivek-door ${isOpen ? 'vivek-door-open' : ''}`}
        style={{ '--door-color': feature.accent } as CSSProperties}
      >
        <div className="vivek-door-arch">
          <div className="vivek-door-surface">
            <div className="vivek-door-grooves" />
            <div className="vivek-door-plate">
              <span className="vivek-door-plate-text">{feature.name}</span>
              <i />
              <i />
            </div>
            <div className="vivek-door-hardware">
              <span className="vivek-door-handle" />
              <span className="vivek-door-lock">
                <b />
              </span>
            </div>
          </div>
        </div>

        <span className="vivek-door-cta">Click to enter</span>

        <div className={`vivek-door-panel vivek-door-panel-${panelSide}`}>
          <h3>{feature.title}</h3>
          <p>{feature.subtitle}</p>
          <ul>
            {feature.highlights.map((item) => (
              <li key={item}>
                <span className="vivek-door-check">
                  <Check aria-hidden="true" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      <AnimatePresence>
        {opening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            style={{ background: `radial-gradient(circle at center, ${feature.accent}30, #0c0a09 70%)` }}
          >
            <motion.div
              initial={{ scale: 0, rotateY: 0 }}
              animate={{ scale: 1, rotateY: 180 }}
              transition={{ duration: 0.6 }}
            >
              <ArrowRight className="w-16 h-16" style={{ color: feature.accent }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
