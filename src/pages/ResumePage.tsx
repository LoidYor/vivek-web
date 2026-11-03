import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye } from 'lucide-react';
import PageHeader, { PageSection } from '@/components/PageHeader';

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  education: string;
  skills: string;
  experience: string;
  projects: string;
}

export default function ResumePage() {
  const [data, setData] = useState<ResumeData>({
    name: '',
    email: '',
    phone: '',
    summary: '',
    education: '',
    skills: '',
    experience: '',
    projects: '',
  });
  const [preview, setPreview] = useState(false);

  const update = (key: keyof ResumeData, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const fields: { key: keyof ResumeData; label: string; type: 'input' | 'textarea'; placeholder: string }[] = [
    { key: 'name', label: 'Full Name', type: 'input', placeholder: 'Vivek Sharma' },
    { key: 'email', label: 'Email', type: 'input', placeholder: 'vivek@example.com' },
    { key: 'phone', label: 'Phone', type: 'input', placeholder: '+91 98765 43210' },
    { key: 'summary', label: 'Professional Summary', type: 'textarea', placeholder: 'A brief summary about yourself...' },
    { key: 'education', label: 'Education', type: 'textarea', placeholder: 'B.Tech in Computer Science, University Name, 2023-2027' },
    { key: 'skills', label: 'Skills', type: 'textarea', placeholder: 'React, TypeScript, Python, SQL, Figma...' },
    { key: 'experience', label: 'Experience', type: 'textarea', placeholder: 'Intern at Company Name — worked on...' },
    { key: 'projects', label: 'Projects', type: 'textarea', placeholder: 'Project Name — description and tech stack...' },
  ];

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Resume Studio"
        subtitle="Build your professional identity"
        description="Create, edit and preview professional resumes with a clean, structured interface."
        accent="#f59e0b"
      />
      <PageSection>
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setPreview(!preview)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold-500/10 border border-gold-500/40 text-gold-300 text-sm font-medium hover:bg-gold-500/20 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {preview ? 'Edit Mode' : 'Preview Resume'}
          </button>
        </div>

        {!preview ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {fields.map((field, i) => (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={field.type === 'textarea' ? 'lg:col-span-2' : ''}
              >
                <label className="block text-xs font-medium uppercase tracking-widest text-stone-500 mb-2">
                  {field.label}
                </label>
                {field.type === 'input' ? (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={data[field.key]}
                    onChange={(e) => update(field.key, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-ink-900 border border-stone-800 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors"
                  />
                ) : (
                  <textarea
                    placeholder={field.placeholder}
                    rows={3}
                    value={data[field.key]}
                    onChange={(e) => update(field.key, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-ink-900 border border-stone-800 text-sm text-stone-200 placeholder:text-stone-600 focus:border-gold-500/50 focus:outline-none transition-colors resize-none"
                  />
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-white text-gray-900 rounded-2xl p-10 shadow-2xl">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h1 className="text-2xl font-bold">{data.name || 'Your Name'}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {data.email || 'email@example.com'} {data.phone && `· ${data.phone}`}
              </p>
            </div>
            {data.summary && (
              <div className="mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Summary</h2>
                <p className="text-sm leading-relaxed">{data.summary}</p>
              </div>
            )}
            {data.education && (
              <div className="mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Education</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line">{data.education}</p>
              </div>
            )}
            {data.skills && (
              <div className="mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Skills</h2>
                <p className="text-sm leading-relaxed">{data.skills}</p>
              </div>
            )}
            {data.experience && (
              <div className="mb-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Experience</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line">{data.experience}</p>
              </div>
            )}
            {data.projects && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Projects</h2>
                <p className="text-sm leading-relaxed whitespace-pre-line">{data.projects}</p>
              </div>
            )}
            {!data.name && !data.summary && !data.skills && (
              <p className="text-center text-gray-400 py-10">
                Fill in the fields to see your resume preview.
              </p>
            )}
          </div>
        )}
        <p className="text-xs text-stone-600 mt-8 text-center">
          Demo interface — resume data is not saved or sent anywhere.
        </p>
      </PageSection>
    </>
  );
}
