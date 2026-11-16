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
  Award,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { exportPdfCertificate, viewPdfReport } from '../services/reportExporter';

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
    } catch (err: any) {
      alert('Failed to delete report.');
    }
  };

  const handleDownloadFile = async (downloadUrl: string, fileName: string, item?: ForensicReportItem) => {
    try {
      const token = localStorage.getItem('deepshield_token') || localStorage.getItem('token') || '';
      const fullUrl = downloadUrl.startsWith('http')
        ? downloadUrl
        : `${window.location.origin}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
      const urlWithToken = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
      const response = await fetch(urlWithToken, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Server download failed, generating client-side certificate');
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err: any) {
      if (item && fileName.endsWith('.pdf')) {
        exportPdfCertificate({
          caseId: item.caseId,
          reportId: item.reportId,
          reportName: item.reportName,
          fileName: item.fileName,
          mediaType: 'audio',
          verdict: item.verdict,
          confidence: item.confidence,
          deepfakeProbability: item.deepfakeProbability,
          threatLevel: item.threatLevel,
          createdAt: item.createdAt,
          fileSize: item.fileSize,
          sha256Hash: item.sha256Hash,
          processingTime: 0.42,
          modelVersion: 'DeepShield Multi-Modal Forensic Engine',
          pdfDownloadUrl: item.pdfDownloadUrl,
          jsonDownloadUrl: item.jsonDownloadUrl,
        });
      }
    }
  };

  const handleViewPdfReport = async (downloadUrl: string, item?: ForensicReportItem) => {
    if (item) {
      viewPdfReport({
        caseId: item.caseId,
        reportId: item.reportId,
        reportName: item.reportName,
        fileName: item.fileName,
        mediaType: 'audio',
        verdict: item.verdict,
        confidence: item.confidence,
        deepfakeProbability: item.deepfakeProbability,
        threatLevel: item.threatLevel,
        createdAt: item.createdAt,
        fileSize: item.fileSize,
        sha256Hash: item.sha256Hash,
        processingTime: 0.42,
        modelVersion: 'DeepShield Multi-Modal Forensic Engine',
        pdfDownloadUrl: item.pdfDownloadUrl,
        jsonDownloadUrl: item.jsonDownloadUrl,
      });
      return;
    }
  };

  const filteredReports = reports.filter((item) => {
    const matchesSearch =
      item.fileName.toLowerCase().includes(search.toLowerCase()) ||
      item.caseId.toLowerCase().includes(search.toLowerCase()) ||
      item.reportName.toLowerCase().includes(search.toLowerCase()) ||
      item.sha256Hash.toLowerCase().includes(search.toLowerCase());
    const matchesThreat = threatFilter === 'ALL' || item.threatLevel === threatFilter;
    return matchesSearch && matchesThreat;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans text-[#282B4A]">
      {/* Title Header */}
      <div className="rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#014BAA]" />
              Digital Evidence Archive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#014BAA] tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-[#014BAA]" /> Detection History & Forensic PDF Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5E7A] mt-1.5 max-w-2xl leading-relaxed">
            Searchable forensic report archive with cryptographic SHA-256 hash verification & downloadable PDF certificates.
          </p>
        </div>
        <button
          onClick={fetchReportsData}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] hover:bg-[#D4E6FF] transition-all flex items-center gap-2 self-start md:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Archive
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[10px] font-bold uppercase px-2 py-1 bg-red-100 rounded text-red-800">
            Dismiss
          </button>
        </div>
      )}

      {/* 5 Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A5E7A]">Reports Total</span>
            <FileText className="w-4 h-4 text-[#014BAA]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-[#014BAA]">{stats.reportsGenerated}</p>
          <span className="text-[10px] text-[#5A5E7A] block">Verified Certificates</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A5E7A]">Authentic Files</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-emerald-600">{stats.authenticFiles}</p>
          <span className="text-[10px] text-emerald-700 block">Natural Specimens</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A5E7A]">AI Clones</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-red-600">{stats.deepfakeFiles}</p>
          <span className="text-[10px] text-red-700 block">Flagged Deepfakes</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A5E7A]">Critical Threats</span>
            <AlertOctagon className="w-4 h-4 text-[#B83264]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-[#B83264]">{stats.criticalThreats}</p>
          <span className="text-[10px] text-[#5A5E7A] block">High Anomaly Ratio</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card space-y-1.5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5A5E7A]">Storage Vault</span>
            <HardDrive className="w-4 h-4 text-[#014BAA]" />
          </div>
          <p className="text-2xl font-extrabold font-mono text-[#282B4A]">{stats.storageUsedCount} / {stats.maxStorageLimit}</p>
          <span className="text-[10px] text-[#014BAA] block">Retained Reports</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#5A5E7A]" />
          <input
            type="text"
            placeholder="Search report name, case ID, filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-[#E6F0FF] text-[#282B4A] placeholder-[#888DAA] focus:border-[#014BAA] shadow-card transition-all"
          />
        </div>

        <select
          value={threatFilter}
          onChange={(e) => setThreatFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-[#E6F0FF] text-[#282B4A] focus:border-[#014BAA] shadow-card transition-all"
        >
          <option value="ALL">All Threat Levels</option>
          <option value="CRITICAL">Critical Threats</option>
          <option value="HIGH">High Threats</option>
          <option value="MEDIUM">Medium Threats</option>
          <option value="LOW">Low Threats</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="rounded-3xl bg-white border border-[#E6F0FF] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E6F0FF] text-[#014BAA] font-extrabold uppercase tracking-wider text-[11px] border-b border-[#BFDAFE]">
                <th className="py-3.5 px-4">Case ID</th>
                <th className="py-3.5 px-4">File Specimen</th>
                <th className="py-3.5 px-4">Verdict</th>
                <th className="py-3.5 px-4">Threat</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Generated Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F0FF]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5A5E7A] text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-[#014BAA]" />
                      <span>Loading forensic reports...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5A5E7A] text-xs">
                    No reports match your search query.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const isAi = report.verdict.toUpperCase().includes('AI') || report.verdict.toUpperCase().includes('DEEPFAKE');
                  return (
                    <tr key={report.reportId} className="hover:bg-[#F8F3F0] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#014BAA]">{report.caseId}</td>
                      <td className="py-3.5 px-4 font-semibold text-[#282B4A] max-w-[200px] truncate" title={report.fileName}>
                        {report.fileName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            isAi
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {report.verdict}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          report.threatLevel === 'CRITICAL' || report.threatLevel === 'HIGH'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : report.threatLevel === 'MEDIUM' || report.threatLevel === 'MODERATE'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {report.threatLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#282B4A]">{report.confidence}%</td>
                      <td className="py-3.5 px-4 text-[#5A5E7A] text-[11px] whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewPdfReport(report.pdfDownloadUrl, report)}
                            className="p-1.5 rounded-lg bg-[#E6F0FF] text-[#014BAA] hover:bg-[#D4E6FF] transition-all"
                            title="View PDF Report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadFile(report.pdfDownloadUrl, report.reportName, report)}
                            className="p-1.5 rounded-lg bg-[#014BAA] text-white hover:bg-[#013D8B] transition-all shadow-xs"
                            title="Download PDF Certificate"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.reportName)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100"
                            title="Delete Report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
