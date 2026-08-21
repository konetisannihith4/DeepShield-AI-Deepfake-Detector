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
      <div className="min-h-screen bg-[#070c1a] flex flex-col items-center justify-center text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#00e6a8]/10 border border-[#00e6a8]/30 flex items-center justify-center text-[#00e6a8] animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="absolute -inset-1 bg-[#00e6a8]/20 rounded-2xl blur-md -z-10 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <span className="font-display font-extrabold text-sm text-[#00e6a8] tracking-wider uppercase">
              Verifying Security Credentials
            </span>
            <p className="text-xs text-slate-400">Authenticating DeepShield Enterprise Console Session...</p>
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
      <div className="min-h-[calc(100vh-4rem)] bg-[#070c1a] p-8 flex flex-col items-center justify-center text-center">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/90 border border-red-500/30 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white font-display">Access Restricted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your identity <strong className="text-slate-200">({user.email})</strong> with role{' '}
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] font-bold">
              {user.role}
            </span>{' '}
            does not possess authorization to access this operational resource.
          </p>
          <div className="pt-2">
            <a
              href="/dashboard"
              className="inline-block px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
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
