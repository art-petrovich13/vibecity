import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminDashboard } from './pages/AdminDashboard';
import { EventDetailPage } from './pages/EventDetailPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { PrintTicketPage } from './pages/PrintTicketPage';
import { ProfilePage } from './pages/ProfilePage';
import { ScannerPage } from './pages/ScannerPage';
import { RegisterPage } from './pages/RegisterPage';
import { useThemeStore } from './stores/themeStore';

const RedirectToHome = () => {
  const location = useLocation();
  return <Navigate to={`/${location.search}`} replace />;
};

export default function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  return (
    <Routes>
      <Route
        path="tickets/:id/print"
        element={
          <ProtectedRoute>
            <PrintTicketPage />
          </ProtectedRoute>
        }
      />
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="events" element={<RedirectToHome />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="scanner"
          element={
            <ProtectedRoute>
              <ScannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="organizer"
          element={
            <ProtectedRoute>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
