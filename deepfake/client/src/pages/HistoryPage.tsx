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
  ScanFace
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { getLocalScanHistory, ScanRecord } from '../services/scanHistoryService';
import { exportPdfCertificate, exportJsonReport } from '../services/reportExporter';

export const HistoryPage: React.FC = () => {
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
      // 1. Get local persistent scans
      const localScans = getLocalScanHistory();

      // 2. Fetch from backend endpoints if available
      const [reportsRes, detectRes] = await Promise.all([
        apiClient.get('/reports/history').catch(() => ({ data: { reports: [] } })),
        apiClient.get('/detect/history?limit=50').catch(() => ({ data: { items: [] } })),
      ]);

      const reportsList: any[] = reportsRes.data?.reports || [];
      const detectList: any[] = detectRes.data?.items || [];

      // 3. Normalize and merge backend + local data
      const mergedMap = new Map<string, ScanRecord>();

      // First insert localScans
      localScans.forEach((loc) => {
        const key = loc.sha256Hash || loc.caseId || loc.reportId;
        mergedMap.set(key, loc);
      });

      // Next ingest /reports/history
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

      // Next ingest /detect/history
      detectList.forEach((det: any) => {
        const hashKey = det.fileHash || det.sha256Hash;
        const key = hashKey || det.id;
        const existing = mergedMap.get(key) || mergedMap.get(det.id);

        if (!existing) {
          const rawConf = det.confidence ?? det.deepfakeProbability ?? det.overallScore ?? 0.95;
          const confPct = rawConf > 1 ? Math.round(rawConf) : Math.round(rawConf * 100);
          const isAi = (det.verdict || det.status || '').toUpperCase().includes('DEEPFAKE') ||
                       (det.verdict || det.status || '').toUpperCase().includes('AI');
          const mType = det.mediaType || (det.originalFileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : det.originalFileName?.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'audio');

          const mergedItem: ScanRecord = {
            caseId: `CASE-${det.createdAt ? new Date(det.createdAt).toISOString().replace(/[-T:]/g, '').slice(0, 8) : '20260815'}-${det.id?.slice(0, 6).toUpperCase() || 'SCAN'}`,
            reportId: det.id || `REP-${Date.now()}`,
            reportName: `report_${det.id}.pdf`,
            fileName: det.originalFileName || det.fileName || 'specimen.bin',
            mediaType: mType,
            durationSeconds: det.durationSeconds || det.duration,
            verdict: isAi ? (mType === 'image' ? 'Likely AI Generated' : mType === 'video' ? 'AI GENERATED VIDEO' : 'AI GENERATED VOICE') : (mType === 'image' ? 'Likely Natural' : 'GENUINE'),
            confidence: confPct,
            threatLevel: (det.riskLevel || det.threatLevel || (isAi ? 'HIGH' : 'LOW')).toUpperCase() as any,
            createdAt: det.createdAt || new Date().toISOString(),
            fileSize: det.fileSize || 500000,
            sha256Hash: det.fileHash || det.sha256Hash || '826112549429f732d1383a99e28387dd29ef8acd95cea3daa935e573231e6cf2',
            processingTime: det.processingTime || 0.42,
            modelVersion: det.modelVersion || (mType === 'image' ? 'xRayon-ConvNeXtV2-Phase2' : mType === 'video' ? 'Xception / EfficientNet Video Classifier' : 'DavidCombei/wavLM-base-Deepfake_V2'),
            pdfDownloadUrl: `/api/reports/download/report_${det.id}.pdf`,
            jsonDownloadUrl: `/api/reports/download/report_${det.id}.json`,
          };

          mergedMap.set(key, mergedItem);
        }
      });

      const normalizedList = Array.from(mergedMap.values());

      // Detect duplicates by hash
      const hashTracker = new Map<string, string>();
      normalizedList.forEach((rec) => {
        if (rec.sha256Hash) {
          if (hashTracker.has(rec.sha256Hash)) {
            rec.isDuplicate = true;
            rec.duplicateCaseId = hashTracker.get(rec.sha256Hash);
          } else {
            hashTracker.set(rec.sha256Hash, rec.caseId);
            rec.isDuplicate = false;
          }
        }
      });

      setItems(normalizedList);
      if (normalizedList.length > 0 && !selectedItem) {
        setSelectedItem(normalizedList[0]);
      }
    } catch (err: any) {
      console.error('[Scan Archive Error]:', err);
      setError('Unable to load scan archive from backend endpoints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanHistory();

    const handleScanCompleted = () => {
      fetchScanHistory();
    };

    window.addEventListener('scanCompleted', handleScanCompleted);
    return () => {
      window.removeEventListener('scanCompleted', handleScanCompleted);
    };
  }, []);

  const handleDownloadFile = async (item: ScanRecord, type: 'pdf' | 'json') => {
    try {
      if (type === 'json') {
        exportJsonReport(item);
      } else {
        await exportPdfCertificate(item);
      }
    } catch (err: any) {
      console.error('[Download Error]:', err);
      setError('Unable to export report file.');
    }
  };

  const handleViewPdfReport = (item: ScanRecord) => {
    exportPdfCertificate(item);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getMediaIcon = (mediaType?: string) => {
    switch (mediaType) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-[#00e6a8] shrink-0" />;
      case 'video':
        return <Film className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      default:
        return <FileAudio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
  };

  // Filter items by search (filename, hash, caseId) and filterType
  const filteredItems = items.filter((item) => {
    const query = search.toLowerCase().trim();
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
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-[#00e6a8] flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#00e6a8]" /> Multi-Modal Deepfake Scan Archive
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Searchable forensic database of analyzed image, audio, and video specimens, SHA-256 cryptographic hashes, and PDF reports.
          </p>
        </div>

        <button
          onClick={fetchScanHistory}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0d1527] hover:bg-slate-800 text-[#00e6a8] border border-[#00e6a8]/30 flex items-center gap-2 self-start md:self-auto transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Archive
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-300 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[10px] font-bold uppercase px-2 py-1 bg-red-500/20 rounded">Dismiss</button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Filename, SHA-256 Hash, Case ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070c1a] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00e6a8]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[#070c1a] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-[#00e6a8]"
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
        {/* Left Side Table */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 p-6 glass-card space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3 font-bold">Case ID</th>
                  <th className="pb-3 px-3 font-bold">Media</th>
                  <th className="pb-3 px-3 font-bold">Filename</th>
                  <th className="pb-3 px-3 font-bold">Prediction</th>
                  <th className="pb-3 px-3 font-bold">Threat</th>
                  <th className="pb-3 px-3 font-bold">Confidence</th>
                  <th className="pb-3 px-3 font-bold">Date & Time</th>
                  <th className="pb-3 px-3 font-bold">SHA-256 Hash</th>
                  <th className="pb-3 px-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full border-2 border-[#00e6a8]/20 border-t-[#00e6a8] animate-spin" />
                        <span>Loading Scan Archive from backend...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                      No scan archive records found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.reportId + item.caseId}
                      onClick={() => setSelectedItem(item)}
                      className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        selectedItem?.caseId === item.caseId ? 'bg-[#00e6a8]/10 border-l-2 border-l-[#00e6a8]' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[#00e6a8]">{item.caseId}</td>
                      <td className="py-3 px-3 font-semibold uppercase text-[10px]">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          {getMediaIcon(item.mediaType)}
                          {item.mediaType || 'image'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-white max-w-[130px] truncate" title={item.fileName}>
                        <span className="truncate">{item.fileName}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.verdict.toUpperCase().includes('AI') || item.verdict.toUpperCase().includes('DEEPFAKE')
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : item.verdict === 'Uncertain'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-[#00e6a8] border border-[#00e6a8]/30'
                          }`}
                        >
                          {item.verdict}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getThreatBadgeStyle(item.threatLevel)}`}>
                          {item.threatLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">{item.confidence}%</td>
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-[#00e6a8]/80 max-w-[110px] truncate" title={item.sha256Hash}>
                        <div className="flex items-center gap-1">
                          <span>{item.sha256Hash.slice(0, 8)}...</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.sha256Hash);
                            }}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                            title="Copy SHA-256 Hash"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#00e6a8]" />
                          </button>
                          <button
                            onClick={() => handleViewPdfReport(item)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                            title="View PDF Certificate"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDownloadFile(item, 'pdf')}
                            className="p-1.5 rounded-lg bg-[#00e6a8]/20 hover:bg-[#00e6a8]/30 text-[#00e6a8] border border-[#00e6a8]/40"
                            title="Download PDF Certificate"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadFile(item, 'json')}
                            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                            title="Export JSON Report"
                          >
                            <FileCode className="w-3.5 h-3.5" />
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

        {/* Right Side Details Panel */}
        <div className="rounded-2xl bg-[#0d1527] border border-[#00e6a8]/30 p-6 glass-card space-y-6">
          {selectedItem ? (
            <div className="space-y-5 text-xs">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-[#00e6a8]/20 border border-[#00e6a8]/40 text-[#00e6a8] flex items-center justify-center shrink-0">
                  {getMediaIcon(selectedItem.mediaType)}
                </div>
                <div className="truncate">
                  <h3 className="font-bold text-white text-sm truncate">{selectedItem.fileName}</h3>
                  <span className="text-[10px] font-mono text-[#00e6a8]">{selectedItem.caseId}</span>
                </div>
              </div>

              {/* Duplicate Warning Banner */}
              {selectedItem.isDuplicate && (
                <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <strong className="text-amber-300">Duplicate File Detected: </strong>
                    This SHA-256 hash matches Case ID <span className="font-mono font-bold text-white">{selectedItem.duplicateCaseId || 'PREVIOUS_SCAN'}</span>.
                  </div>
                </div>
              )}

              {/* Populated Telemetry Fields */}
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Media Modality</span>
                  <span className="font-mono font-bold uppercase text-[#00e6a8] flex items-center gap-1.5">
                    {getMediaIcon(selectedItem.mediaType)}
                    {selectedItem.mediaType}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Case ID</span>
                  <span className="font-mono font-bold text-[#00e6a8]">{selectedItem.caseId}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-mono text-slate-400">SHA-256 Hash</span>
                    <button
                      onClick={() => copyToClipboard(selectedItem.sha256Hash)}
                      className="text-[10px] text-[#00e6a8] hover:underline font-bold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> {copiedHash ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-slate-300 break-all">{selectedItem.sha256Hash}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Prediction</span>
                    <strong
                      className={`text-sm ${
                        selectedItem.verdict.toUpperCase().includes('AI') || selectedItem.verdict.toUpperCase().includes('DEEPFAKE')
                          ? 'text-red-400'
                          : selectedItem.verdict === 'Uncertain'
                          ? 'text-amber-400'
                          : 'text-[#00e6a8]'
                      }`}
                    >
                      {selectedItem.verdict}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Confidence</span>
                    <strong className="text-sm text-white font-mono">{selectedItem.confidence}%</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Threat Level</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block ${getThreatBadgeStyle(selectedItem.threatLevel)}`}>
                      {selectedItem.threatLevel}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">Processing Time</span>
                    <strong className="text-sm text-slate-200 font-mono">{selectedItem.processingTime}s</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Model Version</span>
                  <span className="font-mono text-purple-300 font-bold block">{selectedItem.modelVersion}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Timestamp</span>
                  <span className="text-slate-200 block font-mono">{new Date(selectedItem.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => handleDownloadFile(selectedItem, 'pdf')}
                  className="w-full py-3 rounded-xl bg-[#00e6a8] text-[#070c1a] hover:bg-[#36d399] font-extrabold flex items-center justify-center gap-2 glow-cyan uppercase tracking-wider text-xs"
                >
                  <Download className="w-4 h-4" /> Download PDF Certificate
                </button>

                <button
                  onClick={() => handleDownloadFile(selectedItem, 'json')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 border border-slate-700 text-xs"
                >
                  <FileCode className="w-4 h-4 text-amber-400" /> Export JSON Report
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs space-y-2">
              <Shield className="w-8 h-8 text-slate-600 mx-auto" />
              <p>Select a scan row from the archive table to populate forensic telemetry details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
