import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Shield,
  CheckCircle,
  AlertTriangle,
  HardDrive,
  Trash2,
  FileCode,
  Layers,
  Search,
  Activity,
  AlertOctagon,
  RefreshCw,
  Eye,
  FileAudio,
  Lock,
  Award
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface ForensicReportItem {
  caseId: string;
  reportId: string;
  reportName: string;
  fileName: string;
  verdict: string;
  deepfakeProbability: number;
  confidence: number;
  threatLevel: 'LOW' | 'MODERATE' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  fileSize: number;
  sha256Hash: string;
  pdfDownloadUrl: string;
  jsonDownloadUrl: string;
}

interface ReportStats {
  reportsGenerated: number;
  authenticFiles: number;
  deepfakeFiles: number;
  criticalThreats: number;
  storageUsedCount: number;
  maxStorageLimit: number;
}

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ForensicReportItem[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    reportsGenerated: 0,
    authenticFiles: 0,
    deepfakeFiles: 0,
    criticalThreats: 0,
    storageUsedCount: 0,
    maxStorageLimit: 15,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [threatFilter, setThreatFilter] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  const fetchReportsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyRes, statsRes] = await Promise.all([
        apiClient.get('/reports/history'),
        apiClient.get('/reports/stats'),
      ]);

      if (historyRes.data?.reports) {
        setReports(historyRes.data.reports);
      }
      if (statsRes.data?.stats) {
        setStats(statsRes.data.stats);
      }
    } catch (err: any) {
      console.error('[ReportsPage Error]:', err);
      setError('Unable to load detection history or report archives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const handleDeleteReport = async (reportName: string) => {
    if (!window.confirm(`Are you sure you want to delete forensic report '${reportName}'?`)) {
      return;
    }
    try {
      await apiClient.delete(`/reports/${reportName}`);
      setReports((prev) => prev.filter((r) => r.reportName !== reportName));
      setStats((prev) => ({
        ...prev,
        storageUsedCount: Math.max(0, prev.storageUsedCount - 1),
      }));
    } catch (err: any) {
      console.error('[Delete Error]:', err);
      setError('Failed to delete report file.');
    }
  };

  const handleDownloadFile = async (downloadUrl: string, fileName: string) => {
    try {
      const token = localStorage.getItem('deepshield_token') || localStorage.getItem('token');
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to download report file.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('[Download Error]:', err);
      setError('Unable to download report file.');
    }
  };

  const handleViewPdfReport = (downloadUrl: string) => {
    window.open(downloadUrl, '_blank');
  };

  const latestReport = reports.length > 0 ? reports[0] : null;

  const filteredReports = reports.filter((item) => {
    const matchesSearch =
      item.fileName.toLowerCase().includes(search.toLowerCase()) ||
      item.caseId.toLowerCase().includes(search.toLowerCase()) ||
      item.reportName.toLowerCase().includes(search.toLowerCase()) ||
      item.sha256Hash.toLowerCase().includes(search.toLowerCase());
    const matchesThreat = threatFilter === 'ALL' || item.threatLevel === threatFilter;
    return matchesSearch && matchesThreat;
  });

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
    <div className="p-8 space-y-8 max-w-6xl mx-auto selection:bg-[#00e6a8] selection:text-[#070c1a]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-[#00e6a8] flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#00e6a8]" /> Detection History & SHA-256 Digital Reports
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Searchable forensic report archive with cryptographic SHA-256 hash verification & PDF certificates.
          </p>
        </div>
        <button
          onClick={fetchReportsData}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-[#0d1527] hover:bg-slate-800 text-[#00e6a8] border border-[#00e6a8]/30 flex items-center gap-2 self-start md:self-auto transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Archive
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-300 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[10px] font-bold uppercase px-2 py-1 bg-red-500/20 rounded">Dismiss</button>
        </div>
      )}

      {/* 5 Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Reports Generated</span>
            <FileText className="w-4 h-4 text-[#00e6a8]" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{stats.reportsGenerated}</p>
          <span className="text-[10px] text-slate-500 block">Total Forensic Certificates</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Authentic Voices</span>
            <CheckCircle className="w-4 h-4 text-[#00e6a8]" />
          </div>
          <p className="text-2xl font-extrabold text-[#00e6a8] font-mono">{stats.authenticFiles}</p>
          <span className="text-[10px] text-slate-500 block">Human Vocal Verified</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">AI Voices</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400 font-mono">{stats.deepfakeFiles}</p>
          <span className="text-[10px] text-slate-500 block">Synthetic Voice Clones</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Critical Threats</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-extrabold text-red-400 font-mono">{stats.criticalThreats}</p>
          <span className="text-[10px] text-slate-500 block">High Risk Intercepts</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Storage Used</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-extrabold text-purple-400 font-mono">
            {stats.storageUsedCount} / {stats.maxStorageLimit} <span className="text-xs text-slate-400 font-normal">Reports</span>
          </p>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                stats.storageUsedCount >= 14 ? 'bg-red-500' : stats.storageUsedCount >= 10 ? 'bg-amber-500' : 'bg-[#00e6a8]'
              }`}
              style={{ width: `${(stats.storageUsedCount / stats.maxStorageLimit) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 block">Automated FIFO Pruning</span>
        </div>
      </div>

      {/* Latest Report Card */}
      {latestReport && (
        <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/40 glass-card space-y-4 glow-cyan">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#00e6a8]/20 border border-[#00e6a8]/40 text-[#00e6a8] flex items-center justify-center shrink-0">
                <FileAudio className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#00e6a8] font-bold block">LATEST SHA-256 DIGITAL REPORT</span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {latestReport.reportName}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Case ID: <span className="font-mono text-slate-200">{latestReport.caseId}</span></span>
                  <span>•</span>
                  <span>Specimen: <span className="text-slate-200">{latestReport.fileName}</span></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getThreatBadgeStyle(latestReport.threatLevel)}`}>
                THREAT: {latestReport.threatLevel}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  latestReport.verdict.toUpperCase().includes('DEEPFAKE') || latestReport.verdict.toUpperCase().includes('AI')
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : 'bg-emerald-500/20 text-[#00e6a8] border-[#00e6a8]/40'
                }`}
              >
                {latestReport.verdict.toUpperCase().includes('DEEPFAKE') || latestReport.verdict.toUpperCase().includes('AI') ? 'AI GENERATED' : 'GENUINE VOICE'} ({latestReport.deepfakeProbability}%)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#070c1a] border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block font-semibold">Cryptographic SHA-256 Verification Hash:</span>
              <p className="font-mono text-[11px] text-[#00e6a8] break-all mt-0.5">{latestReport.sha256Hash}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block font-semibold">Timestamp:</span>
              <p className="text-slate-200 mt-0.5">{new Date(latestReport.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs text-[#00e6a8] font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-[#00e6a8]" /> Digital Certificate Verified & Signed
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleViewPdfReport(latestReport.pdfDownloadUrl)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-[#00e6a8]" /> View PDF Report
              </button>
              <button
                onClick={() => handleDownloadFile(latestReport.pdfDownloadUrl, latestReport.reportName)}
                className="px-5 py-2 rounded-lg text-xs font-extrabold bg-[#00e6a8] text-[#070c1a] hover:bg-[#36d399] transition-all flex items-center gap-2 glow-cyan uppercase tracking-wider"
              >
                <Download className="w-4 h-4" /> Download PDF Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detection History Table Section */}
      <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#00e6a8]" /> Detection History Archive
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Searchable history table with SHA-256 fingerprint verification</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Case ID, Filename, SHA-256..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#070c1a] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e6a8] w-64"
              />
            </div>

            <select
              value={threatFilter}
              onChange={(e) => setThreatFilter(e.target.value)}
              className="px-3 py-2 bg-[#070c1a] border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#00e6a8]"
            >
              <option value="ALL">All Threat Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="MODERATE">Moderate</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Threat</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No detection history records found.
                  </td>
                </tr>
              ) : (
                filteredReports.map((item) => (
                  <tr key={item.reportName} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#00e6a8]">{item.caseId}</td>
                    <td className="py-3 px-4 font-medium text-white max-w-xs truncate">{item.fileName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          item.verdict.toUpperCase().includes('DEEPFAKE') || item.verdict.toUpperCase().includes('AI')
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-emerald-500/20 text-[#00e6a8]'
                        }`}
                      >
                        {item.verdict.toUpperCase().includes('DEEPFAKE') || item.verdict.toUpperCase().includes('AI') ? 'AI GENERATED' : 'GENUINE'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getThreatBadgeStyle(item.threatLevel)}`}>
                        {item.threatLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200 font-mono">{item.deepfakeProbability}%</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-[#00e6a8]/80 max-w-[140px] truncate" title={item.sha256Hash}>
                      {item.sha256Hash.slice(0, 14)}...
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewPdfReport(item.pdfDownloadUrl)}
                          title="View PDF Report"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#00e6a8] border border-slate-700 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadFile(item.pdfDownloadUrl, item.reportName)}
                          title="Download PDF Forensic Certificate"
                          className="p-1.5 rounded-lg bg-[#00e6a8]/20 hover:bg-[#00e6a8]/30 text-[#00e6a8] border border-[#00e6a8]/40 transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadFile(item.jsonDownloadUrl, `${item.caseId}_report.json`)}
                          title="Download JSON Report"
                          className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 transition-all"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(item.reportName)}
                          title="Delete Report"
                          className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
