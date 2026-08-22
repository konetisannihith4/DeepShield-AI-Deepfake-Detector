import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Settings as SettingsIcon, Save, Sliders, Database, Shield, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useAuth();
  const [settings, setSettings] = useState<any>({
    AI_SENSITIVITY_THRESHOLD: '0.75',
    ENABLE_REALTIME_MIC_STREAMING: 'true',
    AUTOMATIC_PDF_GENERATION: 'true',
    AUDIT_LOG_RETENTION_DAYS: '90',
  });
  const [saved, setSaved] = useState(false);
  const isLight = theme === 'light';

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
        <h1 className={`text-2xl font-extrabold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Settings & Preferences
        </h1>
        <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Configure theme appearance, AI threshold sensitivity, database retention, and real-time streaming policies
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Appearance & Theme Selector */}
        <div
          className={`p-6 rounded-2xl border transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#0f172a] border-[#1e2a44] text-white glass-card'
          }`}
        >
          <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-[#1e2a44]'}`}>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" /> Platform Appearance
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Choose your preferred user interface color theme for DeepShield.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all border ${
                theme === 'dark'
                  ? 'bg-[#5b63f6] text-white border-[#5b63f6] shadow-lg shadow-[#5b63f6]/20'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  : 'bg-[#050816] text-slate-300 border-[#1e2a44] hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4" /> Dark 🌙 (Default)
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all border ${
                theme === 'light'
                  ? 'bg-[#5b63f6] text-white border-[#5b63f6] shadow-lg shadow-[#5b63f6]/20'
                  : isLight
                  ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" /> Light ☀️
            </button>
          </div>
        </div>

        {/* AI System Configuration Form */}
        <form
          onSubmit={handleSave}
          className={`p-6 rounded-2xl border transition-colors space-y-6 ${
            isLight ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#0f172a] border-[#1e2a44] text-white glass-card'
          }`}
        >
          <div className="space-y-4">
            <h3 className={`text-sm font-bold flex items-center gap-2 border-b pb-3 ${isLight ? 'border-slate-200' : 'border-[#1e2a44]'}`}>
              <Sliders className="w-4 h-4 text-[#5b63f6]" /> AI Engine Thresholds & Data Retention
            </h3>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                AI Deepfake Sensitivity Threshold (0.1 - 0.95)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.95"
                value={settings.AI_SENSITIVITY_THRESHOLD || '0.75'}
                onChange={(e) => setSettings({ ...settings, AI_SENSITIVITY_THRESHOLD: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-[#050816] border-[#1e2a44] text-white'
                }`}
              />
              <span className={`text-[10px] mt-1 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Higher values require stronger spectral anomalies before triggering CRITICAL risk alerts.
              </span>
            </div>

            <div>
              <label className={`text-xs font-semibold block mb-1 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                Audit Log Retention Period (Days)
              </label>
              <input
                type="number"
                value={settings.AUDIT_LOG_RETENTION_DAYS || '90'}
                onChange={(e) => setSettings({ ...settings, AUDIT_LOG_RETENTION_DAYS: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-white'
                }`}
              />
            </div>

            <div className={`pt-2 flex items-center justify-between border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <span className={`text-xs font-semibold block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Enable Realtime Microphone Socket Streaming
                </span>
                <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Allow client WebAudio API packets via Socket.IO
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.ENABLE_REALTIME_MIC_STREAMING === 'true'}
                onChange={(e) => setSettings({ ...settings, ENABLE_REALTIME_MIC_STREAMING: String(e.target.checked) })}
                className="w-4 h-4"
              />
            </div>
          </div>

          <div className={`flex items-center justify-between pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            {saved && <span className="text-xs text-emerald-500 font-semibold">Settings saved to MySQL DB!</span>}
            <button
              type="submit"
              className="ml-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-[#5b63f6] hover:bg-[#4f46e5] text-white shadow-lg flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save System Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
