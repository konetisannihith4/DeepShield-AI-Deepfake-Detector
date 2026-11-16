import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import { Settings as SettingsIcon, Save, Sliders, Database, Shield, Moon, Sun, CheckCircle, Palette } from 'lucide-react';
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans text-[#282B4A]">
      <div className="rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] inline-flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#014BAA]" />
            Configuration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#014BAA] tracking-tight">
          System Settings & Platform Preferences
        </h1>
        <p className="text-xs sm:text-sm text-[#5A5E7A] mt-1.5 max-w-2xl leading-relaxed">
          Configure platform appearance, AI threshold sensitivity, database retention policies, and security logging.
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Appearance & Theme Selector */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6F0FF]">
            <div>
              <h3 className="text-base font-extrabold text-[#014BAA] flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#014BAA]" /> Platform Color Theme
              </h3>
              <p className="text-xs text-[#5A5E7A] mt-0.5">
                Primary cybersecurity interface theme for TrueVision DeepShield.
              </p>
            </div>
            <span className="text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] px-3 py-1 rounded-full">
              Royal Blue + Light Cream
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                theme === 'light'
                  ? 'border-[#014BAA] bg-[#E6F0FF]/40 shadow-royal ring-2 ring-[#014BAA]/20'
                  : 'border-[#E6F0FF] bg-white hover:bg-[#F8F3F0]'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[#014BAA] text-white flex items-center justify-center font-bold shrink-0">
                <Sun className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#014BAA] block">Royal Blue + Light Cream (Active)</span>
                <span className="text-[11px] text-[#5A5E7A] block mt-0.5">
                  High-contrast modern cybersecurity theme with Light Cream backdrop (#F8F3F0) and Royal Blue (#014BAA).
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                theme === 'dark'
                  ? 'border-[#014BAA] bg-[#E6F0FF]/40 shadow-royal ring-2 ring-[#014BAA]/20'
                  : 'border-[#E6F0FF] bg-white hover:bg-[#F8F3F0]'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-[#012E6B] text-white flex items-center justify-center font-bold shrink-0">
                <Moon className="w-4 h-4 text-[#F4B6CC]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#282B4A] block">Dark Cyber Mode</span>
                <span className="text-[11px] text-[#5A5E7A] block mt-0.5">
                  Deep dark-mode console theme for low-light cybersecurity operations centers.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* AI Thresholds Form */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-6">
          <div className="border-b border-[#E6F0FF] pb-3">
            <h3 className="text-base font-extrabold text-[#014BAA] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#014BAA]" /> Neural Detection Sensitivity Thresholds
            </h3>
            <p className="text-xs text-[#5A5E7A] mt-0.5">
              Fine-tune classification boundary probabilities and automated PDF certificate generation
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#282B4A] block mb-1.5">
                AI Detection Sensitivity Threshold (0.10 – 0.99)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.99"
                value={settings.AI_SENSITIVITY_THRESHOLD || '0.75'}
                onChange={(e) => setSettings({ ...settings, AI_SENSITIVITY_THRESHOLD: e.target.value })}
                className="w-full p-3 rounded-xl bg-white border border-[#E6F0FF] font-mono text-xs focus:border-[#014BAA]"
              />
            </div>

            <div>
              <label className="font-bold text-[#282B4A] block mb-1.5">
                Audit Log Retention Window (Days)
              </label>
              <input
                type="number"
                min="7"
                max="365"
                value={settings.AUDIT_LOG_RETENTION_DAYS || '90'}
                onChange={(e) => setSettings({ ...settings, AUDIT_LOG_RETENTION_DAYS: e.target.value })}
                className="w-full p-3 rounded-xl bg-white border border-[#E6F0FF] font-mono text-xs focus:border-[#014BAA]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saved ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Settings Saved Successfully
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#014BAA] hover:bg-[#013D8B] text-white font-extrabold text-xs shadow-royal transition-all flex items-center gap-2 uppercase tracking-wider"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
