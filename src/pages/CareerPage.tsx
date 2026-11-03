import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Search, MapPin, Clock, Award } from 'lucide-react';
import PageHeader, { PageSection } from '@/components/PageHeader';

type Category = 'internships' | 'hackathons' | 'competitions' | 'workshops' | 'certifications';

const items: Record<Category, { title: string; org: string; location: string; deadline: string; tag: string }[]> = {
  internships: [
    { title: 'Software Engineering Intern', org: 'Demo Tech Corp', location: 'Remote', deadline: 'Dec 15, 2026', tag: 'Internship' },
    { title: 'Product Design Intern', org: 'Sample Studios', location: 'Bangalore', deadline: 'Jan 10, 2027', tag: 'Internship' },
    { title: 'Data Science Intern', org: 'Example Labs', location: 'Remote', deadline: 'Dec 20, 2026', tag: 'Internship' },
  ],
  hackathons: [
    { title: 'HackTheFuture 2026', org: 'Demo Foundation', location: 'Hyderabad', deadline: 'Nov 30, 2026', tag: 'Hackathon' },
    { title: 'CodeFest Online', org: 'Sample Community', location: 'Online', deadline: 'Dec 5, 2026', tag: 'Hackathon' },
  ],
  competitions: [
    { title: 'National Coding Championship', org: 'Demo Board', location: 'Online', deadline: 'Jan 15, 2027', tag: 'Competition' },
    { title: 'UI/UX Design Challenge', org: 'Example Org', location: 'Mumbai', deadline: 'Dec 28, 2026', tag: 'Competition' },
  ],
  workshops: [
    { title: 'AI & ML Workshop', org: 'Demo Institute', location: 'Online', deadline: 'Nov 25, 2026', tag: 'Workshop' },
    { title: 'Cloud Computing Bootcamp', org: 'Sample Academy', location: 'Pune', deadline: 'Dec 10, 2026', tag: 'Workshop' },
  ],
  certifications: [
    { title: 'Full Stack Developer Certificate', org: 'Demo Cert Board', location: 'Online', deadline: 'Self-paced', tag: 'Certification' },
    { title: 'AWS Cloud Practitioner', org: 'Example Cloud', location: 'Online', deadline: 'Self-paced', tag: 'Certification' },
  ],
};

const tabs: { key: Category; label: string }[] = [
  { key: 'internships', label: 'Internships' },
  { key: 'hackathons', label: 'Hackathons' },
  { key: 'competitions', label: 'Competitions' },
  { key: 'workshops', label: 'Workshops' },
  { key: 'certifications', label: 'Certifications' },
];

export default function CareerPage() {
  const [active, setActive] = useState<Category>('internships');
  const [search, setSearch] = useState('');

  const filtered = items[active].filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        icon={Briefcase}
        title="Career Hub"
        subtitle="Discover your next opportunity"
        description="Explore internships, hackathons, workshops, competitions and certifications — all curated for students."
        accent="#fb923c"
      />
      <PageSection>
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                active === tab.key
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                  : 'bg-ink-900 text-stone-400 border border-stone-800 hover:border-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-900 border border-stone-800 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors"
          />
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl bg-ink-900 border border-stone-800 hover:border-gold-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400">
                  {item.tag}
                </span>
                <Award className="w-4 h-4 text-stone-600" />
              </div>
              <h3 className="text-sm font-medium text-stone-100 mb-1">{item.title}</h3>
              <p className="text-xs text-stone-500 mb-3">{item.org}</p>
              <div className="flex items-center gap-4 text-xs text-stone-600">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {item.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.deadline}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-stone-600 mt-8 text-center">
          Demo content — these are sample opportunities, not real listings.
        </p>
      </PageSection>
    </>
  );
}
