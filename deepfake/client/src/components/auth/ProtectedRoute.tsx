import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'ADMIN' | 'ANALYST' | 'VIEWER'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F3F0] flex flex-col items-center justify-center text-[#282B4A]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#E6F0FF] border border-[#014BAA]/20 flex items-center justify-center text-[#014BAA]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <span className="font-display font-extrabold text-sm text-[#014BAA] tracking-wider uppercase">
              Verifying Security Credentials
            </span>
            <p className="text-xs text-[#282B4A]/70">Authenticating DeepShield Enterprise Console Session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#F8F3F0] p-8 flex flex-col items-center justify-center text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white border border-red-500/20 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#014BAA] font-display">Access Restricted</h2>
          <p className="text-xs text-[#282B4A]/70 leading-relaxed">
            Your identity <strong className="text-[#282B4A]">({user.email})</strong> with role{' '}
            <span className="px-2 py-0.5 rounded bg-[#E6F0FF] text-[#014BAA] font-mono text-[11px] font-bold border border-[#014BAA]/20">
              {user.role}
            </span>{' '}
            does not possess authorization to access this operational resource.
          </p>
          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-block px-5 py-2.5 rounded-xl text-xs font-bold bg-[#014BAA] hover:bg-[#013b88] text-white transition-colors shadow-sm"
            >
              Return to Security Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
