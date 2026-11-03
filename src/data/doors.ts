export interface DoorFeature {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  highlights: string[];
  route: string;
  accent: string;
}

export const wallDoors: DoorFeature[] = [
  {
    id: '01',
    name: 'NOTES',
    title: 'Notes',
    subtitle: 'Your knowledge library',
    highlights: ['Subject-wise study notes', 'Chapter summaries', 'Downloadable PDFs', 'Quick revision sheets'],
    route: '/notes',
    accent: '#263a5d',
  },
  {
    id: '02',
    name: 'PYQS',
    title: 'Previous Year Questions',
    subtitle: 'Practice like the real exam',
    highlights: ['Year-wise question papers', 'Solved answers', 'Topic-wise practice'],
    route: '/notes?filter=pyqs',
    accent: '#573f52',
  },
  {
    id: '03',
    name: 'RESUME',
    title: 'Resume Studio',
    subtitle: 'Build your professional identity',
    highlights: ['Professional templates', 'Live preview', 'Export-ready PDF', 'Update anytime'],
    route: '/resume',
    accent: '#84947b',
  },
  {
    id: '04',
    name: 'PROJECTS',
    title: 'My Projects',
    subtitle: 'Turn ideas into reality',
    highlights: ['Showcase your best work', 'Organize academic projects', 'Track your progress'],
    route: '/projects',
    accent: '#b85b2c',
  },
];
