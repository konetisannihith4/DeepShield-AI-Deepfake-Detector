import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  BarChart2,
  Upload,
  ArrowUpRight,
  Clock,
  FileAudio,
  Mic,
  Database,
  RefreshCw,
  Eye,
  Download,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ConfidenceRiskMeter } from '../components/ai/ConfidenceRiskMeter';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalScans: 0,
    authenticCount: 0,
    aiCount: 0,
    threatRatio: 0,
    avgConfidence: 95.0,
    duplicateCount: 0,
  });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [reportsRes, statsRes, detectRes] = await Promise.all([
        apiClient.get('/reports/history').catch(() => ({ data: { reports: [] } })),
        apiClient.get('/reports/stats').catch(() => ({ data: { stats: {} } })),
        apiClient.get('/detect/history?limit=20').catch(() => ({ data: { items: [] } })),
      ]);

      const reportsList: any[] = reportsRes.data?.reports || [];
      const detectList: any[] = detectRes.data?.items || [];
      const backendStats: any = statsRes.data?.stats || {};

      // Combine and normalize records
      const mergedMap = new Map<string, any>();

      reportsList.forEach((rep: any) => {
        const key = rep.sha256Hash || rep.reportId || rep.caseId;
        const isAi = (rep.verdict || '').toUpperCase().includes('DEEPFAKE') || (rep.verdict || '').toUpperCase().includes('AI');
        mergedMap.set(key, {
          caseId: rep.caseId || `CASE-${rep.reportId?.slice(0, 6)}`,
          id: rep.reportId || rep.caseId,
          fileName: rep.fileName || rep.originalFileName || 'Audio_Specimen.wav',
          durationSeconds: rep.durationSeconds || rep.duration || 7.7,
          verdict: isAi ? 'AI GENERATED VOICE' : 'GENUINE VOICE',
          riskLevel: (rep.threatLevel || rep.riskLevel || 'LOW').toUpperCase(),
          confidence: rep.confidence ?? rep.deepfakeProbability ?? 90,
          createdAt: rep.createdAt || new Date().toISOString(),
          sha256Hash: rep.sha256Hash || '',
          pdfDownloadUrl: rep.pdfDownloadUrl,
          jsonDownloadUrl: rep.jsonDownloadUrl,
        });
      });

      detectList.forEach((det: any) => {
        const hashKey = det.fileHash || det.sha256Hash;
        const key = hashKey || det.id;
        const existing = mergedMap.get(key) || mergedMap.get(det.id);

        const rawConf = det.confidence ?? det.deepfakeProbability ?? det.overallScore ?? 0.9;
        const confPct = rawConf > 1 ? Math.round(rawConf) : Math.round(rawConf * 100);
        const isAi = (det.verdict || det.status || existing?.verdict || '').toUpperCase().includes('DEEPFAKE') ||
                     (det.verdict || det.status || existing?.verdict || '').toUpperCase().includes('AI');

        mergedMap.set(key, {
          caseId: existing?.caseId || `CASE-${det.id?.slice(0, 6).toUpperCase()}`,
          id: det.id || existing?.id,
          fileName: det.originalFileName || det.fileName || existing?.fileName || 'Audio_Specimen.wav',
          durationSeconds: det.durationSeconds || det.duration || existing?.durationSeconds || 7.7,
          verdict: isAi ? 'AI GENERATED VOICE' : 'GENUINE VOICE',
          riskLevel: (det.riskLevel || det.threatLevel || existing?.riskLevel || 'LOW').toUpperCase(),
          confidence: confPct,
          createdAt: det.createdAt || existing?.createdAt || new Date().toISOString(),
          sha256Hash: det.fileHash || det.sha256Hash || existing?.sha256Hash || '',
          pdfDownloadUrl: existing?.pdfDownloadUrl || `/api/reports/download/${existing?.reportName || `report_${det.id}.pdf`}`,
          jsonDownloadUrl: existing?.jsonDownloadUrl || `/api/reports/download/${existing?.reportName?.replace(/\.pdf$/, '.json') || `report_${det.id}.json`}`,
        });
      });

      const allHistory = Array.from(mergedMap.values());

      // Compute statistics
      const totalScans = allHistory.length || backendStats.reportsGenerated || 0;
      const authenticCount = allHistory.filter((item) => item.verdict.includes('GENUINE')).length || backendStats.authenticFiles || 0;
      const aiCount = allHistory.filter((item) => item.verdict.includes('AI')).length || backendStats.deepfakeFiles || 0;
      const threatRatio = totalScans > 0 ? Math.round((aiCount / totalScans) * 100) : 0;

      const totalConf = allHistory.reduce((acc, item) => acc + (item.confidence || 90), 0);
      const avgConfidence = totalScans > 0 ? Math.round((totalConf / totalScans) * 10) / 10 : 95.0;

      const duplicateCount = allHistory.filter((item, idx, arr) =>
        item.sha256Hash && arr.findIndex((other) => other.sha256Hash === item.sha256Hash) !== idx
      ).length;

      setSummaryData({
        totalScans,
        authenticCount,
        aiCount,
        threatRatio,
        avgConfidence,
        duplicateCount,
      });

      setRecentHistory(allHistory.slice(0, 8));
    } catch (err: any) {
      console.error('[Dashboard Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh when scan finishes
    const handleScanCompleted = () => {
      fetchDashboardData();
    };

    window.addEventListener('scanCompleted', handleScanCompleted);
    return () => {
      window.removeEventListener('scanCompleted', handleScanCompleted);
    };
  }, []);

  const latestItem = recentHistory.length > 0 ? recentHistory[0] : null;

  const getThreatBadgeStyle = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40 glow-red';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'MODERATE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      default:
        return 'bg-emerald-500/20 text-[#00e6a8] border-[#00e6a8]/40 glow-cyan';
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto selection:bg-[#00e6a8] selection:text-[#070c1a]">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-[#00e6a8] flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-[#00e6a8]" /> Executive Voice Clone Threat Dashboard
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time AI voice authentication telemetry and WavLM classification metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-[#0d1527] hover:bg-slate-800 text-[#00e6a8] border border-[#00e6a8]/30 transition-all"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/upload"
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#00e6a8] text-[#070c1a] hover:bg-[#36d399] transition-all flex items-center gap-2 glow-cyan uppercase tracking-wider"
          >
            <Upload className="w-4 h-4" /> Upload Audio
          </Link>
        </div>
      </div>

      {/* Metrics Row (5 key telemetry cards with clean grid, zero overlap) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Voice Scans</span>
            <Activity className="w-4 h-4 text-[#00e6a8]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {summaryData.totalScans}
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">Processed Audio Files</span>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authentic Voices</span>
            <ShieldCheck className="w-4 h-4 text-[#00e6a8]" />
          </div>
          <div className="text-3xl font-extrabold text-[#00e6a8] font-mono">
            {summaryData.authenticCount}
          </div>
          <span className="text-[10px] text-[#00e6a8]/80 font-medium block">Human Speech Verified</span>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Voice Clones</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-extrabold text-red-400 font-mono">
            {summaryData.aiCount}
          </div>
          <span className="text-[10px] text-red-400/80 font-medium block">{summaryData.threatRatio}% Threat Ratio</span>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Model Confidence</span>
            <BarChart2 className="w-4 h-4 text-[#00e6a8]" />
          </div>
          <div className="text-3xl font-extrabold text-[#00e6a8] font-mono">
            {summaryData.avgConfidence}%
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">WavLM Calibrated Engine</span>
        </div>

        {/* Card 5 */}
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duplicate Hashes</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-400 font-mono">
            {summaryData.duplicateCount}
          </div>
          <span className="text-[10px] text-purple-400/80 font-medium block">SHA-256 Cross-Referenced</span>
        </div>
      </div>

      {/* Main Content Grid: Recent Activity Table + Dynamic Risk Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Recent Voice Clone Detection Activity Table */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 p-6 glass-card space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00e6a8]" /> Recent Voice Clone Detection Activity
            </h3>
            <Link to="/history" className="text-xs text-[#00e6a8] hover:underline font-bold flex items-center gap-1">
              View All Scans <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3 font-bold">Audio Specimen</th>
                  <th className="pb-3 px-3 font-bold">Duration</th>
                  <th className="pb-3 px-3 font-bold">Risk Level</th>
                  <th className="pb-3 px-3 font-bold">Confidence</th>
                  <th className="pb-3 px-3 font-bold">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                      No recent voice clone detection activity recorded.
                    </td>
                  </tr>
                ) : (
                  recentHistory.map((item) => (
                    <tr key={item.id + item.caseId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-semibold text-white flex items-center gap-2 truncate max-w-[200px]">
                        <FileAudio className="w-4 h-4 text-[#00e6a8] shrink-0" />
                        <span className="truncate">{item.fileName}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{item.durationSeconds}s</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getThreatBadgeStyle(item.riskLevel)}`}>
                          {item.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {item.confidence}%
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.verdict.includes('AI')
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-[#00e6a8] border border-[#00e6a8]/30'
                          }`}
                        >
                          {item.verdict}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Risk Gauge for Latest Scan */}
        <div className="rounded-2xl bg-[#0d1527] border border-[#00e6a8]/30 p-6 glass-card flex flex-col items-center justify-center space-y-4">
          <span className="text-xs font-bold text-[#00e6a8] uppercase tracking-wider text-center">
            Latest Scan Threat Gauge
          </span>

          <ConfidenceRiskMeter
            score={latestItem ? (latestItem.confidence > 1 ? latestItem.confidence / 100 : latestItem.confidence) : 0.98}
            confidence={latestItem ? latestItem.confidence : 98}
            riskLevel={latestItem ? latestItem.riskLevel : 'CRITICAL'}
            status={latestItem ? (latestItem.verdict.includes('AI') ? 'DEEPFAKE' : 'REAL') : 'DEEPFAKE'}
          />

          {latestItem && (
            <div className="w-full p-3 rounded-xl bg-[#070c1a] border border-slate-800 text-center text-xs space-y-1">
              <span className="text-[10px] text-slate-400 block font-mono">SPECIMEN</span>
              <p className="font-bold text-white truncate">{latestItem.fileName}</p>
              <span className="text-[10px] text-[#00e6a8] font-mono block">Case ID: {latestItem.caseId}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
