import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, Mail } from 'lucide-react';

export default function ContactSection() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Please enter your name';
    if (!form.email.trim()) e.email = 'Please enter your email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email';
    if (!form.subject.trim()) e.subject = 'Please enter a subject';
    if (!form.message.trim()) e.message = 'Please enter a message';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ name: '', email: '', subject: '', message: '' });
      setOpen(false);
    }, 2500);
  };

  return (
    <section id="contact" className="py-24 md:py-32 relative">
      <div className="container-vivek">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="text-sm font-medium uppercase tracking-widest text-gold-400 mb-3">Contact</p>
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-stone-100 mb-4 text-balance">
            Let's Build Something Meaningful.
          </h2>
          <p className="text-lg text-stone-400 mb-8">
            Have a question, idea, or collaboration in mind? I'd love to hear from you.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 text-ink-950 font-medium text-sm shadow-lg shadow-gold-600/30 hover:shadow-xl hover:shadow-gold-500/40 hover:scale-105 transition-all"
          >
            <Mail className="w-4 h-4" />
            Start a Conversation
          </button>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-ink-900 border border-stone-800 shadow-2xl p-8 relative"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-5 right-5 text-stone-500 hover:text-stone-200 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {sent ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-14 h-14 text-gold-400 mx-auto mb-4" />
                  <h3 className="font-display text-2xl font-semibold text-stone-100 mb-2">
                    Message Ready
                  </h3>
                  <p className="text-sm text-stone-400">
                    This is a demo submission. In a live build, your message would be sent to the VIVEK team.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="font-display text-2xl font-semibold text-stone-100 mb-2">
                    Tell me what you're building.
                  </h3>
                  <p className="text-sm text-stone-500 mb-6">
                    Fill in the form below — this is a demo interface.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-ink-950 border border-stone-700 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors"
                      />
                      {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Your email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-ink-950 border border-stone-700 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors"
                      />
                      {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Subject"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-ink-950 border border-stone-700 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors"
                      />
                      {errors.subject && <p className="text-xs text-red-400 mt-1">{errors.subject}</p>}
                    </div>
                    <div>
                      <textarea
                        placeholder="Your message"
                        rows={4}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-ink-950 border border-stone-700 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors resize-none"
                      />
                      {errors.message && <p className="text-xs text-red-400 mt-1">{errors.message}</p>}
                    </div>
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-ink-950 font-medium text-sm shadow-lg shadow-gold-600/20 hover:shadow-xl transition-all"
                    >
                      <Send className="w-4 h-4" />
                      Submit
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
