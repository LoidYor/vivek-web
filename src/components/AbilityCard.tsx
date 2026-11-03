import { useState, useRef, type MouseEvent } from 'react';
import { motion } from 'framer-motion';

const abilities = [
  'Smart Learning',
  'Career Discovery',
  'Knowledge Management',
  'Student Productivity',
  'Project Development',
  'AI-Assisted Experiences',
];

const backText =
  'VIVEK brings notes, resumes, careers, planning, AI assistance and project management into a single, cohesive space — designed for students, built for the future.';

export default function AbilityCard() {
  const [flipped, setFlipped] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current || flipped) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.setProperty('--rx', `${(-y * 10).toFixed(1)}deg`);
    ref.current.style.setProperty('--ry', `${(x * 12).toFixed(1)}deg`);
  };

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="container-vivek">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-gold-400 mb-3">
            What Makes Us Different
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-stone-100 text-balance">
            One Platform. Multiple Possibilities.
          </h2>
          <p className="text-sm text-stone-500 mt-4">Tilt the card. Tap to flip.</p>
        </motion.div>

        <div className="flex justify-center perspective-[1500px]">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={() => setFlipped(!flipped)}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              if (ref.current) {
                ref.current.style.setProperty('--rx', '0deg');
                ref.current.style.setProperty('--ry', '0deg');
              }
            }}
            className="relative w-full max-w-md h-80 cursor-pointer"
            style={{
              transformStyle: 'preserve-3d',
              transform: `${flipped ? 'rotateY(180deg)' : 'rotateX(var(--rx,0)) rotateY(var(--ry,0))'}`,
              transition: 'transform 0.6s ease',
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-3xl p-8 flex flex-col justify-between"
              style={{
                backfaceVisibility: 'hidden',
                background: 'linear-gradient(135deg, #1c1917 0%, #292524 100%)',
                border: '1px solid #fbbf2440',
                boxShadow: '0 30px 60px -20px rgba(251,191,36,0.2), inset 0 1px 0 rgba(251,191,36,0.1)',
              }}
            >
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-gold-400 mb-1">
                  VIVEK
                </p>
                <h3 className="font-display text-2xl font-semibold text-stone-100 mb-6">
                  What makes VIVEK different?
                </h3>
                <ul className="space-y-2.5">
                  {abilities.map((a) => (
                    <li key={a} className="flex items-center gap-2.5 text-sm text-stone-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-xs text-stone-500 text-right">tap to flip →</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 rounded-3xl p-8 flex flex-col justify-center items-center text-center"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 100%)',
                border: '1px solid #fbbf2440',
                boxShadow: '0 30px 60px -20px rgba(251,191,36,0.2), inset 0 1px 0 rgba(251,191,36,0.1)',
              }}
            >
              <h3 className="font-display text-2xl font-semibold text-gold-300 mb-4">
                One Platform. Multiple Possibilities.
              </h3>
              <p className="text-sm text-stone-300 leading-relaxed">{backText}</p>
              <p className="text-xs text-stone-500 mt-6">← tap to flip back</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
