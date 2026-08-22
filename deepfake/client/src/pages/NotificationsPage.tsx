import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotificationsPage: React.FC = () => {
  const { theme } = useAuth();
  const isLight = theme === 'light';
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
      ]);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto selection:bg-[#5b63f6] selection:text-white font-sans">
      <div>
        <h1 className={`text-2xl font-extrabold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Security Alerts & Feeds
        </h1>
        <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          Real-time system notification history and anomaly triggers
        </p>
      </div>

      <div className="space-y-4 max-w-3xl">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-xl border transition-all ${
              n.type === 'ALERT'
                ? isLight
                  ? 'bg-red-50 border-red-200 text-slate-900'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
                : isLight
                ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
                : 'bg-[#0f172a] border-[#1e2a44] text-white glass-card'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-2">
                {n.type === 'ALERT' ? (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                ) : (
                  <Info className={`w-4 h-4 ${isLight ? 'text-[#5b63f6]' : 'text-blue-400'}`} />
                )}
                <span className={n.type === 'ALERT' ? 'text-red-500 font-extrabold' : isLight ? 'text-slate-900' : 'text-white'}>
                  {n.title}
                </span>
              </span>
              <span className={`text-[10px] font-mono font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {new Date(n.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
