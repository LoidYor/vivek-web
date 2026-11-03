import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, User } from 'lucide-react';
import PageHeader, { PageSection } from '@/components/PageHeader';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

const suggestions = [
  'Explain binary search in simple terms',
  'How do I prepare for a technical interview?',
  'Tips for time management as a student',
  'What is the difference between SQL and NoSQL?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'This is a demo response. When an AI service is connected, you will get real, intelligent answers here.',
        },
      ]);
    }, 600);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      <PageHeader
        icon={Sparkles}
        title="AI Assistant"
        subtitle="Think, learn and solve"
        description="An intelligent student assistant for learning, explanations and productivity. Ask anything — your AI study companion."
        accent="#fbbf24"
      />
      <PageSection>
        <div className="max-w-3xl mx-auto">
          {/* Chat area */}
          <div className="min-h-[400px] rounded-2xl bg-ink-900 border border-stone-800 p-6 mb-4 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-gold-400" />
                </div>
                <p className="text-stone-400 mb-6">Ask me anything to get started.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-left text-sm px-4 py-3 rounded-xl bg-ink-950 border border-stone-800 text-stone-300 hover:border-gold-500/40 hover:text-gold-300 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-gold-500/20'
                          : 'bg-stone-800'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-gold-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-gold-500/10 text-gold-100 border border-gold-500/20'
                          : 'bg-ink-950 text-stone-300 border border-stone-800'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-ink-900 border border-stone-800 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-ink-950 hover:scale-105 transition-transform"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-xs text-stone-600 mt-4 text-center">
            Demo interface — AI responses are placeholders. No AI service is connected yet.
          </p>
        </div>
      </PageSection>
    </>
  );
}
