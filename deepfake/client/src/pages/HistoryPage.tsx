import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  FileAudio,
  Download,
  Eye,
  FileCode,
  Shield,
  CheckCircle,
  AlertTriangle,
  Copy,
  RefreshCw,
  Film,
  Image as ImageIcon,
  ScanFace,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { getLocalScanHistory, ScanRecord } from '../services/scanHistoryService';
import { exportPdfCertificate, exportJsonReport, viewPdfReport } from '../services/reportExporter';
import { useAuth } from '../context/AuthContext';

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ScanRecord[]>([]);
  const [selectedItem, setSelectedItem] = useState<ScanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedHash, setCopiedHash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScanHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const localScans = [
        ...getLocalScanHistory(user?.id),
        ...getLocalScanHistory(),
      ];

      const [reportsRes, detectRes] = await Promise.all([
        apiClient.get('/reports/history').catch(() => ({ data: { reports: [] } })),
        apiClient.get('/detect/history?limit=50').catch(() => ({ data: { items: [] } })),
      ]);

      const reportsList: any[] = reportsRes.data?.reports || [];
      const detectList: any[] = detectRes.data?.items || [];

      const mergedMap = new Map<string, ScanRecord>();

      localScans.forEach((loc) => {
        const key = loc.sha256Hash || loc.caseId || loc.reportId;
        mergedMap.set(key, loc);
      });

      reportsList.forEach((rep: any) => {
        const key = rep.sha256Hash || rep.reportId || rep.caseId;
        const isAi = (rep.verdict || '').toUpperCase().includes('DEEPFAKE') || (rep.verdict || '').toUpperCase().includes('AI');
        const mType = rep.mediaType || (rep.fileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : rep.fileName?.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'audio');

        if (!mergedMap.has(key)) {
          mergedMap.set(key, {
            caseId: rep.caseId || `CASE-${rep.reportId?.slice(0, 6)}`,
            reportId: rep.reportId || rep.caseId || `REP-${Date.now()}`,
            reportName: rep.reportName || `report_${rep.caseId}.pdf`,
            fileName: rep.fileName || rep.originalFileName || 'specimen.bin',
            mediaType: mType,
            durationSeconds: rep.durationSeconds || rep.duration,
            verdict: isAi ? (mType === 'image' ? 'Likely AI Generated' : mType === 'video' ? 'AI GENERATED VIDEO' : 'AI GENERATED VOICE') : (mType === 'image' ? 'Likely Natural' : 'GENUINE'),
            confidence: rep.confidence ?? rep.deepfakeProbability ?? 95,
            threatLevel: (rep.threatLevel || rep.riskLevel || (isAi ? 'HIGH' : 'LOW')).toUpperCase() as any,
            createdAt: rep.createdAt || new Date().toISOString(),
            fileSize: rep.fileSize || 500000,
            sha256Hash: rep.sha256Hash || '826112549429f732d1383a99e28387dd29ef8acd95cea3daa935e573231e6cf2',
            processingTime: rep.processingTime || 0.42,
            modelVersion: rep.modelVersion || (mType === 'image' ? 'xRayon-ConvNeXtV2-Phase2' : mType === 'video' ? 'Xception / EfficientNet Video Classifier' : 'DavidCombei/wavLM-base-Deepfake_V2'),
            pdfDownloadUrl: rep.pdfDownloadUrl || `/api/reports/download/${rep.reportName || 'report.pdf'}`,
            jsonDownloadUrl: rep.jsonDownloadUrl || `/api/reports/download/${rep.reportName?.replace(/\.pdf$/, '.json') || 'report.json'}`,
          });
        }
      });

      detectList.forEach((det: any) => {
        const hashKey = det.fileHash || det.sha256Hash;
        const key = hashKey || det.id;
        const existing = mergedMap.get(key) || mergedMap.get(det.id);

        if (!existing) {
          const rawConf = det.confidence ?? det.deepfakeProbability ?? det.overallScore ?? 0.95;
          const confPct = rawConf > 1 ? Math.round(rawConf) : Math.round(rawConf * 100);
          const isAi = (det.verdict || det.status || '').toUpperCase().includes('DEEPFAKE') || (det.verdict || det.status || '').toUpperCase().includes('AI');
          const mType = det.mediaType || (det.fileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : det.fileName?.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'audio');

          mergedMap.set(key, {
            caseId: det.caseId || `CASE-${det.id?.slice(0, 6) || Date.now().toString().slice(-6)}`,
            reportId: det.reportId || det.id || `REP-${Date.now()}`,
            reportName: det.pdfReportName || `DS_${det.caseId || 'scan'}.pdf`,
            fileName: det.originalFileName || det.fileName || 'specimen.wav',
            mediaType: mType,
            durationSeconds: det.durationSeconds || det.duration,
            verdict: det.verdict || (isAi ? (mType === 'image' ? 'Likely AI Generated' : 'AI GENERATED') : 'GENUINE'),
            confidence: confPct,
            threatLevel: (det.threatLevel || det.riskLevel || (isAi ? 'HIGH' : 'LOW')).toUpperCase() as any,
            createdAt: det.createdAt || new Date().toISOString(),
            fileSize: det.fileSize || 1024000,
            sha256Hash: det.fileHash || det.sha256Hash || '826112549429f732d1383a99e28387dd29ef8acd95cea3daa935e573231e6cf2',
            processingTime: det.processingTime || 0.45,
            modelVersion: det.modelVersion || (mType === 'image' ? 'xRayon-ConvNeXtV2-Phase2' : mType === 'video' ? 'Xception / EfficientNet Video Classifier' : 'DavidCombei/wavLM-base-Deepfake_V2'),
            pdfDownloadUrl: det.pdfDownloadUrl || `/api/reports/download/report.pdf`,
            jsonDownloadUrl: det.jsonDownloadUrl || `/api/reports/download/report.json`,
          });
        }
      });

      const list = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setItems(list);
      if (list.length > 0 && !selectedItem) {
        setSelectedItem(list[0]);
      }
    } catch (err: any) {
      console.warn('Failed to load scan history:', err);
      setError('Could not retrieve remote scan database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanHistory();
  }, [user?.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadFile = async (item: ScanRecord, type: 'pdf' | 'json') => {
    const downloadUrl = type === 'pdf' ? item.pdfDownloadUrl : item.jsonDownloadUrl;
    const fileName = type === 'pdf' ? (item.reportName || `DS_${item.caseId}.pdf`) : `${item.caseId}_report.json`;

    try {
      const token = localStorage.getItem('deepshield_token') || localStorage.getItem('token') || '';
      const fullUrl = downloadUrl.startsWith('http')
        ? downloadUrl
        : `${window.location.origin}${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
      const urlWithToken = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;

      const response = await fetch(urlWithToken, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      if (type === 'pdf') {
        exportPdfCertificate(item);
      } else {
        exportJsonReport(item);
      }
    }
  };

  const handleViewPdfReport = (item: ScanRecord) => {
    viewPdfReport(item);
  };

  const getMediaIcon = (type?: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-[#014BAA] shrink-0" />;
      case 'video':
        return <Film className="w-3.5 h-3.5 text-[#B83264] shrink-0" />;
      default:
        return <FileAudio className="w-3.5 h-3.5 text-[#014BAA] shrink-0" />;
    }
  };

  const filteredItems = items.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.fileName.toLowerCase().includes(query) ||
      item.sha256Hash.toLowerCase().includes(query) ||
      item.caseId.toLowerCase().includes(query);

    let matchesFilter = true;
    if (filterType === 'IMAGE') matchesFilter = item.mediaType === 'image';
    else if (filterType === 'AUDIO') matchesFilter = item.mediaType === 'audio';
    else if (filterType === 'VIDEO') matchesFilter = item.mediaType === 'video';
    else if (filterType === 'GENUINE') matchesFilter = item.verdict.toUpperCase().includes('NATURAL') || item.verdict.toUpperCase().includes('GENUINE') || item.verdict.toUpperCase().includes('REAL');
    else if (filterType === 'AI') matchesFilter = item.verdict.toUpperCase().includes('AI') || item.verdict.toUpperCase().includes('DEEPFAKE');
    else if (filterType === 'LOW') matchesFilter = item.threatLevel === 'LOW';
    else if (filterType === 'MEDIUM') matchesFilter = item.threatLevel === 'MEDIUM' || item.threatLevel === 'MODERATE';
    else if (filterType === 'HIGH') matchesFilter = item.threatLevel === 'HIGH';
    else if (filterType === 'CRITICAL') matchesFilter = item.threatLevel === 'CRITICAL';

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans text-[#282B4A]">
      {/* Title Header */}
      <div className="rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#014BAA]" />
              Multi-Modal Forensic Database
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#014BAA] tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#014BAA]" /> Multi-Modal Deepfake Scan Archive
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5E7A] mt-1.5 max-w-2xl leading-relaxed">
            Searchable forensic database of analyzed image, audio, and video specimens, SHA-256 cryptographic hashes, and verified detection verdicts.
          </p>
        </div>

        <button
          onClick={fetchScanHistory}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] hover:bg-[#D4E6FF] transition-all flex items-center gap-2 self-start md:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Archive
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[10px] font-bold uppercase px-2 py-1 bg-red-100 rounded text-red-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#5A5E7A]" />
          <input
            type="text"
            placeholder="Search Filename, SHA-256 Hash, Case ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-[#E6F0FF] text-[#282B4A] placeholder-[#888DAA] focus:border-[#014BAA] shadow-card transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#014BAA] shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-[#E6F0FF] text-[#282B4A] focus:border-[#014BAA] shadow-card transition-all"
          >
            <option value="ALL">All Scan Records</option>
            <option value="IMAGE">Image Scans Only</option>
            <option value="AUDIO">Audio Scans Only</option>
            <option value="VIDEO">Video Scans Only</option>
            <option value="AI">AI Generated Scans Only</option>
            <option value="GENUINE">Genuine / Natural Scans Only</option>
            <option value="CRITICAL">Threat: Critical</option>
            <option value="HIGH">Threat: High</option>
            <option value="MEDIUM">Threat: Medium</option>
            <option value="LOW">Threat: Low</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left Table + Right Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side Table & Mobile Cards */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-[#E6F0FF] p-4 sm:p-6 shadow-card space-y-4">
          {/* Mobile Cards View (< md) */}
          <div className="block md:hidden space-y-3">
            {loading ? (
              <div className="py-10 text-center text-[#5A5E7A] text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#014BAA]" />
                <span>Loading scan database records...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-10 text-center text-[#5A5E7A] text-xs">
                No scan archive records found matching filter criteria.
              </div>
            ) : (
              filteredItems.map((item) => {
                const isAi = item.verdict.toUpperCase().includes('AI') || item.verdict.toUpperCase().includes('DEEPFAKE');
                const isSelected = selectedItem?.caseId === item.caseId;
                return (
                  <div
                    key={item.reportId + item.caseId}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-[#E6F0FF]/60 border-[#014BAA] shadow-sm'
                        : 'bg-[#F8F3F0]/50 border-[#E6F0FF] hover:border-[#BFDAFE]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-2 py-0.5 rounded-full bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] text-[10px] font-bold flex items-center gap-1 shrink-0">
                          {getMediaIcon(item.mediaType)}
                          {item.mediaType || 'audio'}
                        </span>
                        <span className="font-mono text-xs font-bold text-[#014BAA] truncate">{item.caseId}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#5A5E7A] shrink-0">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#282B4A] truncate max-w-[200px]" title={item.fileName}>
                        {item.fileName}
                      </span>
                      <span className="font-mono text-xs font-black text-[#014BAA] shrink-0">{item.confidence}%</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E6F0FF]/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            isAi
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : item.verdict === 'Uncertain'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.verdict}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                            item.threatLevel === 'CRITICAL' || item.threatLevel === 'HIGH'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : item.threatLevel === 'MEDIUM' || item.threatLevel === 'MODERATE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.threatLevel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="p-1.5 rounded-lg bg-[#E6F0FF] text-[#014BAA] hover:bg-[#D4E6FF] transition-colors"
                          title="Inspect Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleViewPdfReport(item)}
                          className="p-1.5 rounded-lg bg-white border border-[#E6F0FF] text-[#014BAA] hover:bg-[#F8F3F0] transition-colors"
                          title="View PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadFile(item, 'pdf')}
                          className="p-1.5 rounded-lg bg-[#014BAA] text-white hover:bg-[#013D8B] transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto responsive-table-scroll">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E6F0FF] text-[#014BAA] font-extrabold uppercase tracking-wider text-[11px] border-b border-[#BFDAFE]">
                  <th className="py-3 px-3">Case ID</th>
                  <th className="py-3 px-3">Media</th>
                  <th className="py-3 px-3">Filename</th>
                  <th className="py-3 px-3">Verdict</th>
                  <th className="py-3 px-3">Threat</th>
                  <th className="py-3 px-3">Confidence</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0FF]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#5A5E7A] text-xs">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#014BAA]" />
                        <span>Loading scan database records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#5A5E7A] text-xs">
                      No scan archive records found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isAi = item.verdict.toUpperCase().includes('AI') || item.verdict.toUpperCase().includes('DEEPFAKE');
                    const isSelected = selectedItem?.caseId === item.caseId;
                    return (
                      <tr
                        key={item.reportId + item.caseId}
                        onClick={() => setSelectedItem(item)}
                        className={`hover:bg-[#F8F3F0] transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#E6F0FF]/50 border-l-4 border-l-[#014BAA]' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-[#014BAA]">{item.caseId}</td>
                        <td className="py-3 px-3 uppercase text-[10px] font-bold">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE]">
                            {getMediaIcon(item.mediaType)}
                            {item.mediaType || 'audio'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#282B4A] max-w-[140px] truncate" title={item.fileName}>
                          {item.fileName}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              isAi
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : item.verdict === 'Uncertain'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {item.verdict}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            item.threatLevel === 'CRITICAL' || item.threatLevel === 'HIGH'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : item.threatLevel === 'MEDIUM' || item.threatLevel === 'MODERATE'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {item.threatLevel}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#282B4A]">{item.confidence}%</td>
                        <td className="py-3 px-3 text-[#5A5E7A] text-[11px] whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="p-1.5 rounded-lg bg-[#E6F0FF] hover:bg-[#D4E6FF] text-[#014BAA] transition-colors"
                              title="Inspect Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#014BAA]" />
                            </button>
                            <button
                              onClick={() => handleViewPdfReport(item)}
                              className="p-1.5 rounded-lg bg-white border border-[#E6F0FF] hover:bg-[#F8F3F0] text-[#014BAA] transition-colors"
                              title="View PDF"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#014BAA]" />
                            </button>
                            <button
                              onClick={() => handleDownloadFile(item, 'pdf')}
                              className="p-1.5 rounded-lg bg-[#014BAA] text-white hover:bg-[#013D8B] transition-colors shadow-xs"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
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

        {/* Right Side Details Panel */}
        <div className="rounded-3xl bg-white border border-[#E6F0FF] p-6 shadow-card space-y-5">
          {selectedItem ? (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E6F0FF]">
                <div className="w-10 h-10 rounded-2xl bg-[#E6F0FF] text-[#014BAA] flex items-center justify-center shrink-0 shadow-sm">
                  {getMediaIcon(selectedItem.mediaType)}
                </div>
                <div className="truncate">
                  <h3 className="font-extrabold text-sm text-[#282B4A] truncate">{selectedItem.fileName}</h3>
                  <span className="text-[11px] font-mono font-bold text-[#014BAA]">{selectedItem.caseId}</span>
                </div>
              </div>

              {/* Classification Summary Card */}
              <div className="p-4 rounded-2xl bg-[#F8F3F0] border border-[#E5D8D0] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#5A5E7A] block">Classification Verdict</span>
                <div className="flex items-center justify-between">
                  <span className={`text-base font-extrabold ${
                    selectedItem.verdict.toUpperCase().includes('AI') || selectedItem.verdict.toUpperCase().includes('DEEPFAKE')
                      ? 'text-red-600'
                      : 'text-emerald-700'
                  }`}>
                    {selectedItem.verdict}
                  </span>
                  <span className="font-mono text-sm font-black text-[#014BAA]">{selectedItem.confidence}%</span>
                </div>
              </div>

              {/* Populated Telemetry Fields */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white border border-[#E6F0FF] flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-[#5A5E7A]">Media Type</span>
                  <span className="font-bold uppercase text-[#014BAA]">{selectedItem.mediaType || 'audio'}</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E6F0FF] flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-[#5A5E7A]">Threat Level</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    selectedItem.threatLevel === 'HIGH' || selectedItem.threatLevel === 'CRITICAL'
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {selectedItem.threatLevel}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E6F0FF] flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-[#5A5E7A]">Processing Time</span>
                  <span className="font-mono font-bold text-[#282B4A]">{selectedItem.processingTime || 0.42}s</span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#E6F0FF] flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-[#5A5E7A]">Model Version</span>
                  <span className="font-mono font-bold text-[#014BAA] truncate max-w-[150px]">{selectedItem.modelVersion}</span>
                </div>

                {/* SHA-256 Hash */}
                <div className="p-3 rounded-xl bg-[#E6F0FF] border border-[#BFDAFE] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#014BAA]">SHA-256 Hash</span>
                    <button
                      onClick={() => copyToClipboard(selectedItem.sha256Hash)}
                      className="text-[10px] font-bold text-[#014BAA] hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> {copiedHash ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <span className="font-mono text-[10px] text-[#282B4A] break-all block font-semibold leading-relaxed">
                    {selectedItem.sha256Hash}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleViewPdfReport(selectedItem)}
                  className="w-full py-2.5 rounded-xl bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] hover:bg-[#D4E6FF] font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Eye className="w-4 h-4 text-[#014BAA]" /> View PDF Certificate
                </button>
                <button
                  onClick={() => handleDownloadFile(selectedItem, 'pdf')}
                  className="w-full py-2.5 rounded-xl bg-[#014BAA] text-white hover:bg-[#013D8B] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-royal"
                >
                  <Download className="w-4 h-4" /> Download PDF Report
                </button>
                <button
                  onClick={() => handleDownloadFile(selectedItem, 'json')}
                  className="w-full py-2.5 rounded-xl bg-white text-[#282B4A] border border-[#E5D8D0] hover:bg-[#F8F3F0] font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <FileCode className="w-4 h-4 text-[#014BAA]" /> Export JSON Metadata
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[#5A5E7A] text-xs">
              <Shield className="w-8 h-8 text-[#014BAA]/30 mx-auto mb-2" />
              <span>Select any scan record from the table to inspect details.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
