import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';

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
      ]);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold font-display text-white">Security Alerts & Feeds</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time system notification history and anomaly triggers</p>
      </div>

      <div className="space-y-4 max-w-3xl">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-xl border transition-all ${
              n.type === 'ALERT'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-slate-900 border-slate-800 text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-sm">
              <span className="flex items-center gap-2">
                {n.type === 'ALERT' ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <Info className="w-4 h-4 text-blue-400" />}
                {n.title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{new Date(n.createdAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
