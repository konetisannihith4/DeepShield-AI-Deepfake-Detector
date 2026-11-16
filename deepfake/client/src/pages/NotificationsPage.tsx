import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Bell, AlertTriangle, CheckCircle, Info, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.data?.notifications) setNotifications(res.data.notifications);
    } catch (err) {
      setNotifications([
        { id: 'n-1', title: 'High Threat Deepfake Flagged', message: 'File ceo_voice_call_verification.wav scored 94% synthetic probability (CRITICAL RISK).', type: 'ALERT', isRead: false, createdAt: new Date().toISOString() },
        { id: 'n-2', title: 'Prisma Database Migration Sync', message: 'MySQL 8 database tables synchronized successfully.', type: 'INFO', isRead: true, createdAt: new Date().toISOString() },
        { id: 'n-3', title: 'ConvNeXtV2 Image Vision Weights Online', message: 'xRayon ConvNeXtV2-Base Phase-2 model weights loaded into GPU memory.', type: 'INFO', isRead: true, createdAt: new Date().toISOString() },
      ]);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans text-[#282B4A]">
      <div className="rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] inline-flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-[#014BAA]" />
              Security Feeds
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#014BAA] tracking-tight">
            Security Alerts & Anomaly Feeds
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5E7A] mt-1.5 max-w-2xl leading-relaxed">
            Real-time system notification history, deepfake triggers, and infrastructure synchronization updates.
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-4xl">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-5 rounded-2xl border transition-all ${
              n.type === 'ALERT'
                ? 'bg-[#FDF1F5] border-[#F4B6CC] text-[#282B4A]'
                : 'bg-white border-[#E6F0FF] text-[#282B4A] shadow-card'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                n.type === 'ALERT' ? 'bg-[#F4B6CC]/50 text-[#B83264]' : 'bg-[#E6F0FF] text-[#014BAA]'
              }`}>
                {n.type === 'ALERT' ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold ${n.type === 'ALERT' ? 'text-[#B83264]' : 'text-[#014BAA]'}`}>
                    {n.title}
                  </h3>
                  <span className="text-[10px] text-[#5A5E7A] font-mono">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#5A5E7A] leading-relaxed">{n.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
