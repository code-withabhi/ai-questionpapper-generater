import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import LoginPage from '@/features/auth/LoginPage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Dashboard from '@/features/dashboard/Dashboard';
import SubjectsList from '@/features/subjects/SubjectsList';
import SubjectDetail from '@/features/subjects/SubjectDetail';
import ChapterDetail from '@/features/chapters/ChapterDetail';
import QuestionsList from '@/features/questions/QuestionsList';
import AIGeneratePage from '@/features/ai-generate/AIGeneratePage';
import PapersList from '@/features/papers/PapersList';
import PaperDetail from '@/features/papers/PaperDetail';
import SettingsPage from '@/features/settings/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/subjects" element={<SubjectsList />} />
                    <Route path="/subjects/:id" element={<SubjectDetail />} />
                    <Route path="/subjects/:subjectId/chapters/:chapterId" element={<ChapterDetail />} />
                    <Route path="/questions" element={<QuestionsList />} />
                    <Route path="/ai-generate" element={<AIGeneratePage />} />
                    <Route path="/papers" element={<PapersList />} />
                    <Route path="/papers/:id" element={<PaperDetail />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<div>Page not found</div>} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

