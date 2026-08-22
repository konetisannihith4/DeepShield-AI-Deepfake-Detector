import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  History,
  FileText,
  Users,
  Building2,
  ShieldCheck,
  Bell,
  Settings,
  Cpu,
  Film,
  Image as ImageIcon,
  PieChart,
  Sliders,
  Shield,
  FolderCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, theme } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isLight = theme === 'light';

  // Standard Analyst / User Navigation Items
  const standardNavItems: Array<{ label: string; path: string; icon: any }> = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Audio Detector', path: '/upload', icon: Mic },
    { label: 'Image Detection', path: '/image-detection', icon: ImageIcon },
    { label: 'Video Detection', path: '/video-detection', icon: Film },
    { label: 'Detection Analytics', path: '/detection-analytics', icon: PieChart },
    { label: 'Scan Archive', path: '/history', icon: History },
    { label: 'Forensic PDF Reports', path: '/reports', icon: FileText },
    { label: 'Alerts & Feeds', path: '/notifications', icon: Bell },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  // Administrative System Control Navigation (Admin Only)
  const adminNavItems: Array<{ label: string; path: string; icon: any }> = [
    { label: 'User Directory', path: '/users', icon: Users },
    { label: 'Organizations', path: '/organizations', icon: Building2 },
    { label: 'Audit Log Stream', path: '/audit-logs', icon: ShieldCheck },
    { label: 'WavLM Model Specs', path: '/model-details', icon: Cpu },
    { label: 'System Settings', path: '/system-settings', icon: Sliders },
  ];

  return (
    <aside
      className={`w-64 border-r p-6 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] select-none transition-colors duration-200 z-10 font-sans ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-[#0b1120] border-[#1e2a44] text-white'
      }`}
    >
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-[#5b63f6] flex items-center justify-center text-white shadow-md shadow-[#5b63f6]/30">
            <Shield className="w-5 h-5 fill-white text-[#5b63f6]" />
          </div>
          <span className={`text-xl font-black tracking-tight font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
            DeepShield
          </span>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col gap-1.5 mt-2">
          {standardNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-[16px] text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#5b63f6] text-white shadow-lg shadow-[#5b63f6]/25 scale-[1.01]'
                      : isLight
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#1e2a44]/60 font-semibold'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : isLight ? 'text-slate-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Admin System Section */}
          {isAdmin && (
            <div className={`flex flex-col gap-1.5 pt-4 mt-2 border-t ${isLight ? 'border-slate-200' : 'border-[#1e2a44]'}`}>
              <span className={`text-[11px] font-extrabold uppercase tracking-wider px-4 mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Administration
              </span>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-4 py-3 rounded-[16px] text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#5b63f6] text-white shadow-lg shadow-[#5b63f6]/25 scale-[1.01]'
                          : isLight
                          ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-[#1e2a44]/60 font-semibold'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : isLight ? 'text-slate-600' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom 3D Folder Illustration Widget */}
      <div
        className={`relative mt-8 p-4 rounded-2xl flex items-center gap-3 overflow-hidden transition-colors duration-200 border ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-900 shadow-sm'
            : 'bg-[#050816] border-[#1e2a44] text-white'
        }`}
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#5b63f6]/20 rounded-xl transform -rotate-6 scale-95" />
            <div className="absolute inset-0 bg-[#818cf8] rounded-xl transform rotate-3 scale-95 opacity-80" />
            <div className="relative w-10 h-10 bg-gradient-to-tr from-[#5b63f6] to-[#818cf8] rounded-xl flex items-center justify-center shadow-md shadow-[#5b63f6]/30 text-white">
              <FolderCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Protected Vault
            </span>
            <span className={`text-[11px] font-semibold block ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Multi-Modal AI Security
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
