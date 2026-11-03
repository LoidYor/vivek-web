import { motion } from 'framer-motion';

const timeline = [
  {
    num: '01',
    period: 'The Idea',
    title: 'A single space for students',
    body: 'VIVEK started as a simple thought: students juggle too many tools. Notes here, planners there, career resources scattered everywhere. What if one place could hold it all?',
  },
  {
    num: '02',
    period: 'The Vision',
    title: 'Knowledge that makes you think',
    body: 'Not just a toolbox, but an experience. A platform that feels intentional, beautiful, and built for the way students actually learn and create.',
  },
  {
    num: '03',
    period: 'Building the Experience',
    title: 'From concept to creation',
    body: 'Every feature was designed with the student journey in mind — from first lecture to final project, from resume to first job offer.',
  },
  {
    num: '04',
    period: 'The Future of VIVEK',
    title: 'Always evolving',
    body: 'VIVEK is not a finished product. It grows with every student who uses it, adapting to new needs, new tools, and new ways of learning.',
  },
];

export default function StorySection() {
  return (
    <section id="story" className="py-24 md:py-32 relative">
      <div className="container-vivek">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-gold-400 mb-3">Our Story</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-stone-100 mb-4 text-balance">
            More Than Just a Platform.
          </h2>
        </motion.div>

        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-gold-500/50 via-gold-600/30 to-transparent" />

          {timeline.map((item, i) => (
            <motion.div
              key={item.num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative pl-12 md:pl-0 mb-12 md:mb-16 ${
                i % 2 === 0 ? 'md:pr-[52%] md:text-right' : 'md:pl-[52%]'
              }`}
            >
              {/* Node */}
              <div
                className={`absolute top-2 w-3 h-3 rounded-full bg-gold-400 ring-4 ring-ink-950 ${
                  i % 2 === 0
                    ? 'left-[9px] md:left-auto md:right-[-6px]'
                    : 'left-[9px] md:left-[-6px]'
                }`}
              />
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-display text-3xl font-semibold text-gold-500/40">{item.num}</span>
                <span className="text-xs font-medium uppercase tracking-widest text-gold-400">
                  {item.period}
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold text-stone-100 mb-3">{item.title}</h3>
              <p className="text-sm text-stone-400 leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
