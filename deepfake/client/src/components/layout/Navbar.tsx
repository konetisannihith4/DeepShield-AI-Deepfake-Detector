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
  const isLight = theme === 'light';

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
    <header
      className={`h-16 border-b sticky top-0 z-40 px-6 flex items-center justify-between transition-colors duration-200 ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-900 shadow-sm backdrop-blur-md'
          : 'bg-[#0b1120] border-[#1e2a44] text-white backdrop-blur-md'
      }`}
    >
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              isLight
                ? 'bg-[#5b63f6]/10 border border-[#5b63f6]/30 text-[#5b63f6] group-hover:bg-[#5b63f6] group-hover:text-white shadow-sm'
                : 'bg-[#5b63f6]/20 border border-[#5b63f6]/40 text-[#5b63f6] group-hover:bg-[#5b63f6] group-hover:text-white shadow-md shadow-[#5b63f6]/20'
            }`}
          >
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg text-[#5b63f6] tracking-tight">TRUEVISION</span>
            <span className={`text-[10px] uppercase tracking-widest font-extrabold block -mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              DEEPSHIELD ENTERPRISE
            </span>
          </div>
        </Link>

        {/* Model Active Badge */}
        <div
          className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs border font-medium ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-[#0f172a] border-[#1e2a44] text-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#5b63f6] animate-pulse" />
          <span>
            Engine: <strong className={isLight ? 'text-slate-900 font-bold' : 'text-white'}>DeepShield Multi-Modal Engine</strong>
          </span>
        </div>
      </div>

      {/* Global Search & User Actions */}
      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block w-64">
          <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search audio scans, hashes..."
            className={`w-full pl-9 pr-4 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:border-[#5b63f6] ${
              isLight
                ? 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-500'
                : 'bg-[#0f172a] border border-[#1e2a44] text-slate-100 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg border transition-colors ${
            isLight
              ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              : 'bg-[#0f172a] border-[#1e2a44] text-slate-300 hover:text-white'
          }`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#5b63f6]" />}
        </button>

        {/* Notifications Dropdown Toggle */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg border relative transition-colors ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-[#0f172a] border-[#1e2a44] text-slate-300 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5" />
          </button>

          {showNotifications && (
            <div
              className={`absolute right-0 mt-2 w-80 rounded-xl border shadow-2xl p-4 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 ${
                isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-[#0f172a] border-[#1e2a44] text-slate-100'
              }`}
            >
              <div className={`flex items-center justify-between pb-2 border-b mb-3 ${isLight ? 'border-slate-200' : 'border-[#1e2a44]'}`}>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>System Security Notifications</span>
                <span className="text-[10px] text-[#5b63f6] hover:underline cursor-pointer font-bold">
                  Mark all read
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-red-50 border-red-200 text-slate-800' : 'bg-red-500/10 border-red-500/20 text-slate-200'}`}>
                  <div className="font-semibold text-red-500">Critical Deepfake Alert</div>
                  <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    ceo_voice_call_verification.wav scored 94% threat likelihood.
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#050816] border-[#1e2a44] text-slate-200'}`}>
                  <div className="font-semibold text-[#5b63f6]">Prisma Database Ready</div>
                  <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
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
            className={`flex items-center gap-2.5 pl-3 border-l group hover:opacity-90 transition-opacity ${
              isLight ? 'border-slate-200' : 'border-[#1e2a44]'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5b63f6] to-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#5b63f6]/30">
              {getInitials(user?.fullName)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className={`text-xs font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {user?.fullName || 'Authenticated User'}
              </span>
              <span className={`text-[10px] flex items-center gap-1 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${
                  isLight ? 'bg-slate-200 text-slate-800' : 'bg-[#1e2a44] text-[#818cf8]'
                }`}>
                  {user?.role || 'ANALYST'}
                </span>
                <span>•</span>
                <span className="truncate max-w-[100px] font-semibold">{user?.organizationName || 'Enterprise Corp'}</span>
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div
              className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 ${
                isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50' : 'bg-[#0f172a] border-[#1e2a44] text-slate-100'
              }`}
            >
              <div className={`p-2.5 border-b mb-1 space-y-0.5 rounded-lg ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050816] border-[#1e2a44]'}`}>
                <div className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.fullName}</div>
                <div className={`text-[11px] truncate font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{user?.email}</div>
                <div className="text-[10px] text-[#5b63f6] pt-1 flex items-center gap-1 font-mono font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Role: {user?.role}</span>
                </div>
              </div>
              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className={`flex items-center gap-2 p-2 rounded-lg font-semibold transition-colors ${
                  isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-[#1e2a44] text-slate-200'
                }`}
              >
                <UserIcon className="w-4 h-4" /> Account Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-red-500/10 text-red-500 font-semibold transition-colors mt-1"
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
