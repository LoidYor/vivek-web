import type { DocType } from './types';

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_EXTRACT_CHARS = 60_000;

export const ACCEPTED_MIME: Record<string, DocType> = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/x-markdown': 'md',
};

export function docTypeForFile(file: File): DocType | null {
  if (file.name.toLowerCase().endsWith('.md')) return 'md';
  return ACCEPTED_MIME[file.type] ?? null;
}

export function humanSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function clip(text: string): string {
  return text.length > MAX_EXTRACT_CHARS ? `${text.slice(0, MAX_EXTRACT_CHARS)}\n[...text truncated for analysis]` : text;
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  const maxPages = Math.min(pdf.numPages, 60);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(text);
  }
  if (pdf.numPages > maxPages) {
    pages.push(`[Document truncated: only first ${maxPages} of ${pdf.numPages} pages extracted]`);
  }
  const joined = pages.join('\n\n').trim();
  if (!joined) {
    throw new Error('Is PDF mein koi selectable text nahi mila. Scanned PDF (image) ke liye OCR support nahi hai — kripya text file ya meeting note use karein.');
  }
  return clip(joined);
}

async function extractTextFile(file: File): Promise<string> {
  const raw = await file.text();
  return clip(raw);
}

export async function extractText(file: File, docType: DocType): Promise<string> {
  if (docType === 'pdf') return extractPdf(file);
  if (docType === 'txt' || docType === 'md') return extractTextFile(file);
  throw new Error(`Is file type (${docType}) ka text extraction support nahi hai`);
}

export function extractFromPasted(title: string, text: string): string {
  const header = `# ${title}\n\n`;
  return clip(header + text.trim());
}
