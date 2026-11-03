import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import NotesPage from '@/pages/NotesPage';
import ResumePage from '@/pages/ResumePage';
import CareerPage from '@/pages/CareerPage';
import AssistantPage from '@/pages/AssistantPage';
import PlannerPage from '@/pages/PlannerPage';
import LinkedInPage from '@/pages/LinkedInPage';
import LearningPage from '@/pages/LearningPage';
import ProjectsPage from '@/pages/ProjectsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/resume" element={<ResumePage />} />
        <Route path="/career" element={<CareerPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/linkedin" element={<LinkedInPage />} />
        <Route path="/learning" element={<LearningPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
      </Routes>
    </Layout>
  );
}
