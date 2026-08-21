import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Settings as SettingsIcon, Save, Sliders, Database, Shield } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    AI_SENSITIVITY_THRESHOLD: '0.75',
    ENABLE_REALTIME_MIC_STREAMING: 'true',
    AUTOMATIC_PDF_GENERATION: 'true',
    AUDIT_LOG_RETENTION_DAYS: '90',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      if (res.data?.settings) setSettings(res.data.settings);
    } catch (err) {
      console.warn('Using default settings state:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put('/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert('Failed to save settings');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold font-display text-white">System Settings & Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">Configure AI threshold sensitivity, database retention, and real-time streaming policies</p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl p-6 rounded-2xl bg-slate-900 border border-slate-800 glass-card space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-1">
              AI Deepfake Sensitivity Threshold (0.1 - 0.95)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="0.95"
              value={settings.AI_SENSITIVITY_THRESHOLD || '0.75'}
              onChange={(e) => setSettings({ ...settings, AI_SENSITIVITY_THRESHOLD: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Higher values require stronger spectral anomalies before triggering CRITICAL risk alerts.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-1">
              Audit Log Retention Period (Days)
            </label>
            <input
              type="number"
              value={settings.AUDIT_LOG_RETENTION_DAYS || '90'}
              onChange={(e) => setSettings({ ...settings, AUDIT_LOG_RETENTION_DAYS: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Enable Realtime Microphone Socket Streaming</span>
              <span className="text-[10px] text-slate-400">Allow client WebAudio API packets via Socket.IO</span>
            </div>
            <input
              type="checkbox"
              checked={settings.ENABLE_REALTIME_MIC_STREAMING === 'true'}
              onChange={(e) => setSettings({ ...settings, ENABLE_REALTIME_MIC_STREAMING: String(e.target.checked) })}
              className="w-4 h-4"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {saved && <span className="text-xs text-emerald-400 font-semibold">Settings saved to MySQL DB!</span>}
          <button
            type="submit"
            className="ml-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};
