import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
}

export default function PageHeader({ icon: Icon, title, subtitle, description, accent }: PageHeaderProps) {
  return (
    <div className="pt-32 pb-16 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          background: `radial-gradient(ellipse at top, ${accent}, transparent 60%)`,
        }}
      />
      <div className="container-vivek relative">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-gold-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to VIVEK
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: `${accent}1a`, border: `1px solid ${accent}40` }}
          >
            <Icon className="w-7 h-7" style={{ color: accent }} />
          </div>
          <p className="text-sm font-medium uppercase tracking-widest mb-3" style={{ color: accent }}>
            {subtitle}
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-semibold text-stone-100 mb-4 text-balance">
            {title}
          </h1>
          <p className="text-lg text-stone-400 max-w-2xl leading-relaxed">{description}</p>
        </motion.div>
      </div>
    </div>
  );
}

export function PageSection({ children }: { children: ReactNode }) {
  return <div className="container-vivek py-12">{children}</div>;
}
