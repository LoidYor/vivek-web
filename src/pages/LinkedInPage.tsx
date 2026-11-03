import { useState } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Lightbulb, PenLine, UserCircle } from 'lucide-react';
import PageHeader, { PageSection } from '@/components/PageHeader';

const headlineSuggestions = [
  'Computer Science Student | Full-Stack Developer | Passionate about building products that matter',
  'Aspiring Software Engineer | React & TypeScript | Open to internships',
  'CS Undergrad | AI/ML Enthusiast | 2x Hackathon Winner',
  'Data Science Student | Python | SQL | Always learning, always building',
];

const aboutTips = [
  'Start with who you are — your current role or studies.',
  'Mention 2-3 key skills or areas of expertise.',
  'Add what you are looking for — internships, collaborations, or roles.',
  'Keep it concise — 3-4 short paragraphs maximum.',
  'End with a personal touch — what drives or excites you.',
];

const postIdeas = [
  'Share a project you recently built — what you learned and what went wrong.',
  'Write about a concept you struggled to understand and how you finally got it.',
  'Document your learning journey — a week in the life of a CS student.',
  'Share a tool, library, or resource that changed your workflow.',
];

export default function LinkedInPage() {
  const [activeTab, setActiveTab] = useState<'headline' | 'about' | 'posts'>('headline');

  const tabs = [
    { key: 'headline' as const, label: 'Headline', icon: UserCircle },
    { key: 'about' as const, label: 'About Section', icon: PenLine },
    { key: 'posts' as const, label: 'Post Ideas', icon: Lightbulb },
  ];

  return (
    <>
      <PageHeader
        icon={Linkedin}
        title="LinkedIn Studio"
        subtitle="Build your digital presence"
        description="Improve your professional profile, craft better headlines, get about-section guidance, and generate post ideas for your personal brand."
        accent="#fb923c"
      />
      <PageSection>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                  : 'bg-ink-900 text-stone-400 border border-stone-800 hover:border-stone-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === 'headline' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {headlineSuggestions.map((h, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-ink-900 border border-stone-800 hover:border-gold-500/30 transition-colors cursor-pointer group"
                >
                  <p className="text-sm text-stone-300 group-hover:text-gold-300 transition-colors leading-relaxed">
                    {h}
                  </p>
                  <p className="text-xs text-stone-600 mt-3">Suggestion #{i + 1}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-2xl">
              <h3 className="font-display text-lg font-semibold text-stone-100 mb-4">
                How to write a strong About section
              </h3>
              <ol className="space-y-3">
                {aboutTips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex gap-3 p-4 rounded-xl bg-ink-900 border border-stone-800"
                  >
                    <span className="font-display text-lg font-semibold text-gold-500/50 flex-shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm text-stone-300 leading-relaxed pt-1">{tip}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {postIdeas.map((idea, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-ink-900 border border-stone-800 hover:border-gold-500/30 transition-colors"
                >
                  <Lightbulb className="w-5 h-5 text-gold-400 mb-3" />
                  <p className="text-sm text-stone-300 leading-relaxed">{idea}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
        <p className="text-xs text-stone-600 mt-8 text-center">
          Demo interface — suggestions are templates, not personalized AI output.
        </p>
      </PageSection>
    </>
  );
}
