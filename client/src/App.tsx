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

