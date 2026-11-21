import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { VideoDetectionPage } from './pages/VideoDetectionPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DetectionAnalyticsPage } from './pages/DetectionAnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ModelDetailsPage } from './pages/ModelDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { VerifyReportPage } from './pages/VerifyReportPage';

const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  // Close mobile drawer and scroll to top upon route transition
  React.useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col font-sans bg-[#F8F3F0] text-[#282B4A] transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      <Navbar
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        isMobileMenuOpen={mobileMenuOpen}
      />
      <div className="flex flex-1 w-full max-w-full overflow-x-hidden">
        <Sidebar
          isMobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden bg-[#F8F3F0] text-[#282B4A] transition-colors duration-200">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/image-detection" element={<UploadPage />} />
            <Route path="/video-detection" element={<VideoDetectionPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/detection-analytics" element={<DetectionAnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/verify/:id" element={<VerifyReportPage />} />
            <Route path="/report/:id" element={<VerifyReportPage />} />

            {/* RBAC Protected Admin System Routes */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizations"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <OrganizationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/model-details"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ModelDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-settings"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const location = useLocation();

  const isPublicPage =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password' ||
    location.pathname === '/verify-email' ||
    location.pathname.startsWith('/verify/') ||
    location.pathname.startsWith('/report/');

  if (isPublicPage) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify/:id" element={<VerifyReportPage />} />
        <Route path="/report/:id" element={<VerifyReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  );
};
