import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  Upload,
  History,
  BarChart3,
  FileText,
  Users,
  Building2,
  ShieldCheck,
  Bell,
  Settings,
  Cpu,
  Globe,
  Film,
  Image as ImageIcon,
  PieChart,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems: Array<{ label: string; path: string; icon: any; badge?: string }> = [
    { label: 'Public Portal', path: '/', icon: Globe },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Audio Detector', path: '/upload', icon: Mic },
    { label: 'Image Detection', path: '/image-detection', icon: ImageIcon, badge: 'CONVNEXT' },
    { label: 'Video Detection', path: '/video-detection', icon: Film, badge: 'XCEPTION' },
    { label: 'Scan Archive', path: '/history', icon: History },
    { label: 'Detection Analytics', path: '/detection-analytics', icon: PieChart },
    { label: 'Forensic PDF Reports', path: '/reports', icon: FileText },
    { label: 'User Directory', path: '/users', icon: Users },
    { label: 'Organizations', path: '/organizations', icon: Building2 },
    { label: 'Audit Log Stream', path: '/audit-logs', icon: ShieldCheck },
    { label: 'Alerts & Feeds', path: '/notifications', icon: Bell },
    { label: 'WavLM Model Specs', path: '/model-details', icon: Cpu },
    { label: 'System Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
          Platform Navigation
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Database Badge */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex flex-col gap-1">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span>Engine Status</span>
          <span className="text-emerald-400 font-mono">ONLINE</span>
        </div>
        <span className="text-[10px]">MySQL 8 + Prisma ORM</span>
        <span className="text-[10px]">Socket.IO Real-time WebAudio</span>
      </div>
    </aside>
  );
};
