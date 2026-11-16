import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, Search, User as UserIcon, LogOut, ShieldCheck, Menu, X, CheckCircle, Sparkles, Sun, Moon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
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
    <header className="h-16 bg-[#014BAA] text-white border-b border-[#013D8B] sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-md select-none transition-all">
      {/* Left: Mobile Hamburger + Brand Logo */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#F4B6CC]"
          aria-label="Toggle navigation menu"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-[#F4B6CC]" /> : <Menu className="w-5 h-5 text-white" />}
        </button>

        {/* Brand Logo & Name */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-white text-[#014BAA] flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 fill-[#014BAA]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight">
                TRUEVISION
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4B6CC]" title="Deepfake Defense Active" />
            </div>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-extrabold block -mt-0.5 text-[#E6F0FF]/90">
              DEEPSHIELD AI DEFENSE
            </span>
          </div>
        </Link>

        {/* Engine Status Badge (Desktop & Tablet) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[#013D8B]/80 border border-white/15 text-[#E6F0FF] font-medium ml-2">
          <span className="w-2 h-2 rounded-full bg-[#F4B6CC] animate-ping" />
          <span>
            Engine: <strong className="text-white font-bold">Image • Video • Voice Multi-Modal AI</strong>
          </span>
        </div>
      </div>

      {/* Center/Right: Search Bar & User Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search Bar (Visible on lg screens) */}
        <div className="relative hidden xl:block w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#E6F0FF]/70" />
          <input
            type="text"
            placeholder="Search specimen hash, case..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 text-white placeholder-[#E6F0FF]/60 border border-white/20 transition-all focus:bg-white focus:text-[#282B4A] focus:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F4B6CC]"
          />
        </div>

        {/* Quick Detection Mode Link (Pill Badge) */}
        <div className="hidden sm:flex items-center gap-1.5 bg-white/10 p-1 rounded-xl border border-white/15 text-[11px] font-bold">
          <Link
            to="/image-detection"
            className="px-2.5 py-1 rounded-lg text-white hover:bg-white hover:text-[#014BAA] transition-all"
          >
            Image
          </Link>
          <Link
            to="/video-detection"
            className="px-2.5 py-1 rounded-lg text-white hover:bg-white hover:text-[#014BAA] transition-all"
          >
            Video
          </Link>
          <Link
            to="/upload"
            className="px-2.5 py-1 rounded-lg text-white hover:bg-white hover:text-[#014BAA] transition-all"
          >
            Voice
          </Link>
        </div>

        {/* Theme Toggle Button (Royal Blue Light Cream vs Dark Cyber Mode) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 focus:outline-none flex items-center justify-center cursor-pointer"
          title={theme === 'dark' ? 'Switch to Royal Blue + Light Cream Theme' : 'Switch to Dark Cyber Mode'}
          aria-label="Toggle Platform Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#F4B6CC] hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-white hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Notifications Dropdown Toggle */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white relative transition-all active:scale-95 focus:outline-none"
            title="System Security Alerts"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-white" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F4B6CC] absolute top-1 right-1 border-2 border-[#014BAA]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white border border-[#E6F0FF] shadow-xl p-4 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 text-[#282B4A]">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6F0FF] mb-3">
                <span className="font-bold text-[#014BAA] text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#014BAA]" /> Security Telemetry Alerts
                </span>
                <span className="text-[10px] text-[#014BAA] hover:underline cursor-pointer font-bold bg-[#E6F0FF] px-2 py-0.5 rounded-full">
                  All Active
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="p-3 rounded-xl bg-[#FDF1F5] border border-[#F4B6CC]/60 text-[#282B4A]">
                  <div className="font-bold text-[#B83264] flex items-center justify-between">
                    <span>Critical Anomaly Flagged</span>
                    <span className="text-[10px] bg-[#F4B6CC] text-[#282B4A] px-1.5 py-0.2 rounded font-extrabold">HIGH</span>
                  </div>
                  <p className="text-[11px] mt-1 text-[#5A5E7A]">
                    Deepfake audio and facial manipulation detection active on all specimens.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#E6F0FF] border border-[#BFDAFE] text-[#282B4A]">
                  <div className="font-bold text-[#014BAA] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-[#014BAA]" />
                    <span>Neural Models Calibrated</span>
                  </div>
                  <p className="text-[11px] mt-1 text-[#5A5E7A]">
                    WavLM-base, ConvNeXtV2 & XceptionNet weights verified.
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
            className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-white/20 group hover:opacity-95 transition-opacity focus:outline-none"
            aria-label="User Account Menu"
          >
            <div className="w-8 h-8 rounded-xl bg-white text-[#014BAA] font-extrabold text-xs flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-white/50">
              {getInitials(user?.fullName)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold leading-tight text-white truncate max-w-[120px]">
                {user?.fullName || 'Security Analyst'}
              </span>
              <span className="text-[10px] flex items-center gap-1 text-[#E6F0FF]/90 font-medium">
                <span className="bg-[#013D8B] text-white px-1.5 py-0.2 rounded text-[9px] font-bold">
                  {user?.role || 'ANALYST'}
                </span>
                <span>•</span>
                <span className="truncate max-w-[90px] font-semibold">{user?.organizationName || 'Enterprise'}</span>
              </span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white border border-[#E6F0FF] shadow-2xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 text-[#282B4A]">
              <div className="p-3 border-b border-[#E6F0FF] mb-1 space-y-1 rounded-xl bg-[#F8F3F0]">
                <div className="font-bold text-[#014BAA] text-sm">{user?.fullName || 'Security Analyst'}</div>
                <div className="text-[11px] truncate font-medium text-[#5A5E7A]">{user?.email || 'analyst@deepshield.ai'}</div>
                <div className="text-[10px] text-[#014BAA] pt-1 flex items-center gap-1 font-mono font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#014BAA]" />
                  <span>Role: {user?.role || 'ANALYST'}</span>
                </div>
              </div>
              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl font-semibold text-[#282B4A] hover:bg-[#E6F0FF] hover:text-[#014BAA] transition-colors"
              >
                <UserIcon className="w-4 h-4 text-[#014BAA]" /> Account Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition-colors mt-0.5"
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
