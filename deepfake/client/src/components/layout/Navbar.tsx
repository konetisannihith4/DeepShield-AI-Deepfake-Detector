import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, Moon, Sun, Search, User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, theme, toggleTheme, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-[#070c1a]/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-[#00e6a8]/20 border border-[#00e6a8]/40 flex items-center justify-center text-[#00e6a8] group-hover:bg-[#00e6a8] group-hover:text-[#070c1a] transition-all shadow-md shadow-[#00e6a8]/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg text-[#00e6a8] tracking-tight">TRUEVISION</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block -mt-1">
              DEEPSHIELD ENTERPRISE
            </span>
          </div>
        </Link>

        {/* Model Active Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-[#00e6a8] animate-pulse" />
          <span>
            Engine: <strong className="text-slate-100">DeepShield Multi-Modal Engine</strong>
          </span>
        </div>
      </div>

      {/* Global Search & User Actions */}
      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search audio scans, hashes..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e6a8] transition-colors"
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>

        {/* Notifications Dropdown Toggle */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="font-semibold text-slate-200">System Security Notifications</span>
                <span className="text-[10px] text-[#00e6a8] hover:underline cursor-pointer">Mark all read</span>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-slate-300">
                  <div className="font-semibold text-red-400">Critical Deepfake Alert</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ceo_voice_call_verification.wav scored 94% threat likelihood.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                  <div className="font-semibold text-[#00e6a8]">Prisma Database Ready</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    MySQL 8 database tables synchronized successfully.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Authenticated User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-3 border-l border-slate-800 group hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00e6a8] to-blue-600 flex items-center justify-center font-bold text-xs text-[#070c1a] shadow-md shadow-[#00e6a8]/20">
              {getInitials(user?.fullName)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {user?.fullName || 'Authenticated User'}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[#00e6a8] font-mono text-[9px] font-bold">
                  {user?.role || 'ANALYST'}
                </span>
                <span>•</span>
                <span className="truncate max-w-[100px]">{user?.organizationName || 'Enterprise Corp'}</span>
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-2.5 border-b border-slate-800 mb-1 space-y-0.5 bg-slate-950/50 rounded-lg">
                <div className="font-semibold text-slate-200">{user?.fullName}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="text-[10px] text-[#00e6a8] pt-1 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Role: {user?.role}</span>
                </div>
              </div>
              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <UserIcon className="w-4 h-4" /> Account Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors mt-1"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
