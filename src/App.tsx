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
import AdminMaterialsPage from '@/pages/AdminMaterialsPage';
import KbLayout from '@/kb/KbLayout';
import KbDashboard from '@/kb/pages/KbDashboard';
import KbProjects from '@/kb/pages/KbProjects';
import KbLibrary from '@/kb/pages/KbLibrary';
import KbAnalyzer from '@/kb/pages/KbAnalyzer';
import KbTasksDecisions from '@/kb/pages/KbTasksDecisions';
import KbTimeline from '@/kb/pages/KbTimeline';
import KbHandover from '@/kb/pages/KbHandover';
import KbReports from '@/kb/pages/KbReports';
import KbSettings from '@/kb/pages/KbSettings';

export default function App() {
  return (
    <Routes>
      {/* KnowledgeBridge AI — standalone workspace, outside the VIVEK layout */}
      <Route path="/knowledgebridge" element={<KbLayout />}>
        <Route index element={<KbDashboard />} />
        <Route path="projects" element={<KbProjects />} />
        <Route path="library" element={<KbLibrary />} />
        <Route path="analyzer" element={<KbAnalyzer />} />
        <Route path="tasks" element={<KbTasksDecisions />} />
        <Route path="timeline" element={<KbTimeline />} />
        <Route path="handover" element={<KbHandover />} />
        <Route path="reports" element={<KbReports />} />
        <Route path="settings" element={<KbSettings />} />
      </Route>

      {/* VIVEK website — untouched */}
      <Route
        path="*"
        element={
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
              <Route path="/admin/materials" element={<AdminMaterialsPage />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
