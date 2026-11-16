import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Cpu, PieChart, ShieldAlert, CheckCircle, AlertTriangle, HardDrive, Database, Activity, RefreshCw } from 'lucide-react';
import { apiClient } from '../services/apiClient';

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [reportStats, setReportStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, reportStatsRes] = await Promise.all([
        apiClient.get('/detect/analytics/summary').catch(() => null),
        apiClient.get('/reports/stats').catch(() => null),
      ]);
      if (analyticsRes?.data?.summary) setAnalytics(analyticsRes.data.summary);
      if (reportStatsRes?.data?.stats) setReportStats(reportStatsRes.data.stats);
    } catch (err) {
      console.warn('[Analytics Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalScans = analytics?.totalScans ?? reportStats?.reportsGenerated ?? 0;
  const authenticVoices = analytics?.authenticCount ?? reportStats?.authenticFiles ?? 0;
  const aiVoices = analytics?.deepfakesDetected ?? reportStats?.deepfakeFiles ?? 0;
  const criticalThreats = reportStats?.criticalThreats ?? 0;
  const storageUsed = reportStats?.storageUsedCount ?? 0;
  const storageMax = reportStats?.maxStorageLimit ?? 15;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans text-[#282B4A]">
      <div className="rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] inline-flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#014BAA]" />
              Enterprise Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#014BAA] tracking-tight flex items-center gap-3">
            Enterprise Detection Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5E7A] mt-1.5 max-w-2xl leading-relaxed">
            Real-time threat analytics, voice clone distribution, storage usage, and specimen telemetry.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] hover:bg-[#D4E6FF] transition-all flex items-center gap-2 self-start md:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Top 4 Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A5E7A]">Authentic Media</span>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600 font-mono">{authenticVoices}</p>
          <span className="text-[11px] text-emerald-700 font-semibold block">Verified Human Vocal Scans</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A5E7A]">AI Deepfakes</span>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-black text-red-600 font-mono">{aiVoices}</p>
          <span className="text-[11px] text-red-600 font-semibold block">Flagged Synthetic Inferences</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A5E7A]">Critical Threats</span>
            <ShieldAlert className="w-5 h-5 text-[#B83264]" />
          </div>
          <p className="text-3xl font-black text-[#B83264] font-mono">{criticalThreats}</p>
          <span className="text-[11px] text-[#5A5E7A] font-semibold block">Severity Escalations</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A5E7A]">Vault Storage</span>
            <HardDrive className="w-5 h-5 text-[#014BAA]" />
          </div>
          <p className="text-3xl font-black text-[#014BAA] font-mono">{storageUsed} / {storageMax}</p>
          <span className="text-[11px] text-[#5A5E7A] font-semibold block">Retained Forensic Reports</span>
        </div>
      </div>
    </div>
  );
};
