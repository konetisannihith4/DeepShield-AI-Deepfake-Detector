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
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, onCloseMobileMenu }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Standard Analyst / User Navigation Items
  const standardNavItems: Array<{ label: string; path: string; icon: any; badge?: string; badgeColor?: string }> = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Image Detection', path: '/image-detection', icon: ImageIcon, badge: 'AI Vision', badgeColor: 'bg-[#F4B6CC] text-[#282B4A]' },
    { label: 'Video Detection', path: '/video-detection', icon: Film, badge: 'Xception', badgeColor: 'bg-[#E6F0FF] text-[#014BAA]' },
    { label: 'Voice Detection', path: '/upload', icon: Mic, badge: 'WavLM', badgeColor: 'bg-[#E6F0FF] text-[#014BAA]' },
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
    { label: 'Model Specs', path: '/model-details', icon: Cpu },
    { label: 'System Settings', path: '/system-settings', icon: Sliders },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full select-none font-sans">
      <div className="flex flex-col gap-4">
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between md:hidden pb-3 border-b border-[#E6F0FF]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#014BAA] text-white flex items-center justify-center font-bold shadow-sm">
              <Shield className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="font-display font-extrabold text-base tracking-tight text-[#014BAA]">
                TRUEVISION
              </span>
              <span className="text-[9px] uppercase tracking-wider block font-bold text-[#5A5E7A] -mt-0.5">
                DEEPSHIELD AI
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobileMenu}
            className="p-2 rounded-xl bg-[#E6F0FF] text-[#014BAA] hover:bg-[#D4E6FF] transition-all"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Label: Multi-Modal Detection Suite */}
        <div className="px-2 pt-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#014BAA] bg-[#E6F0FF] px-2.5 py-1 rounded-full inline-block">
            Detection Modules & Tools
          </span>
        </div>

        {/* Navigation Items List */}
        <div className="flex flex-col gap-1">
          {standardNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobileMenu}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                    isActive
                      ? 'bg-[#014BAA] text-white shadow-md shadow-[#014BAA]/25 scale-[1.01]'
                      : 'text-[#282B4A] hover:text-[#014BAA] hover:bg-[#E6F0FF] font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 truncate">
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isActive ? 'text-white' : 'text-[#014BAA]'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && !isActive && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#F4B6CC] shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Admin System Section */}
          {isAdmin && (
            <div className="flex flex-col gap-1 pt-3 mt-2 border-t border-[#E6F0FF]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 mb-1 text-[#5A5E7A]">
                Administration
              </span>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobileMenu}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 min-h-[44px] ${
                        isActive
                          ? 'bg-[#014BAA] text-white shadow-md shadow-[#014BAA]/25 scale-[1.01]'
                          : 'text-[#282B4A] hover:text-[#014BAA] hover:bg-[#E6F0FF] font-medium'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isActive ? 'text-white' : 'text-[#014BAA]'}`} />
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

      {/* Bottom Protected Vault Widget */}
      <div className="mt-6 p-3.5 rounded-2xl bg-[#E6F0FF] border border-[#BFDAFE] flex items-center gap-3 transition-colors">
        <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
          <div className="w-9 h-9 rounded-xl bg-[#014BAA] text-white flex items-center justify-center shadow-sm">
            <FolderCheck className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#F4B6CC] rounded-full border-2 border-white" />
        </div>
        <div className="truncate">
          <span className="text-xs font-bold block text-[#014BAA] truncate">
            Protected Vault Active
          </span>
          <span className="text-[10px] font-semibold block text-[#5A5E7A] truncate">
            Multi-Modal Defense 2.0
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E6F0FF] p-5 shrink-0 min-h-[calc(100vh-4rem)] shadow-card z-10 transition-colors">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobileMenu}
            aria-hidden="true"
          />

          {/* Slide-out Drawer */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full p-5 shadow-2xl z-10 flex flex-col overflow-y-auto animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
