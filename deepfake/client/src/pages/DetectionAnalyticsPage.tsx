import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  Shield,
  FileAudio,
  Film,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Layers,
  Cpu,
  TrendingUp,
  Activity,
  Zap,
  Info,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { getLocalScanHistory, ScanRecord } from '../services/scanHistoryService';
import { useAuth } from '../context/AuthContext';

export const DetectionAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const localScans = getLocalScanHistory(user?.id);

      const [reportsRes, detectRes] = await Promise.all([
        apiClient.get('/reports/history').catch(() => ({ data: { reports: [] } })),
        apiClient.get('/detect/history?limit=100').catch(() => ({ data: { items: [] } })),
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
        if (!mergedMap.has(key)) {
          const isAi = (rep.verdict || '').toUpperCase().includes('DEEPFAKE') || (rep.verdict || '').toUpperCase().includes('AI');
          const mType = rep.mediaType || (rep.fileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : rep.fileName?.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'audio');
          mergedMap.set(key, {
            caseId: rep.caseId || `CASE-${rep.reportId?.slice(0, 6)}`,
            reportId: rep.reportId || `REP-${Date.now()}`,
            reportName: rep.reportName || `DS_${rep.caseId}.pdf`,
            fileName: rep.fileName || rep.originalFileName || 'specimen.bin',
            mediaType: mType,
            durationSeconds: rep.durationSeconds || rep.duration,
            verdict: isAi ? (mType === 'image' ? 'Likely AI Generated' : 'AI GENERATED') : (mType === 'image' ? 'Likely Natural' : 'GENUINE'),
            confidence: rep.confidence ?? 95,
            threatLevel: (rep.threatLevel || (isAi ? 'HIGH' : 'LOW')).toUpperCase() as any,
            createdAt: rep.createdAt || new Date().toISOString(),
            fileSize: rep.fileSize || 500000,
            sha256Hash: rep.sha256Hash || '826112549429f732d1383a99e28387dd29ef8acd95cea3daa935e573231e6cf2',
            processingTime: rep.processingTime || 0.42,
            modelVersion: rep.modelVersion || 'DeepShield Multi-Modal Forensic Engine',
            pdfDownloadUrl: rep.pdfDownloadUrl || `/api/reports/download/report.pdf`,
            jsonDownloadUrl: rep.jsonDownloadUrl || `/api/reports/download/report.json`,
          });
        }
      });

      detectList.forEach((det: any) => {
        const key = det.fileHash || det.sha256Hash || det.id;
        if (!mergedMap.has(key)) {
          const isAi = (det.verdict || det.status || '').toUpperCase().includes('DEEPFAKE') || (det.verdict || det.status || '').toUpperCase().includes('AI');
          const mType = det.mediaType || (det.fileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : det.fileName?.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'audio');
          mergedMap.set(key, {
            caseId: det.caseId || `CASE-${det.id?.slice(0, 6)}`,
            reportId: det.reportId || det.id || `REP-${Date.now()}`,
            reportName: det.pdfReportName || `DS_${det.caseId || 'scan'}.pdf`,
            fileName: det.fileName || det.originalFileName || 'specimen.bin',
            mediaType: mType,
            durationSeconds: det.durationSeconds || det.duration,
            verdict: det.verdict || (isAi ? 'AI GENERATED' : 'GENUINE'),
            confidence: det.confidence ?? 95,
            threatLevel: (det.threatLevel || (isAi ? 'HIGH' : 'LOW')).toUpperCase() as any,
            createdAt: det.createdAt || new Date().toISOString(),
            fileSize: det.fileSize || 1024000,
            sha256Hash: det.fileHash || det.sha256Hash || '826112549429f732d1383a99e28387dd29ef8acd95cea3daa935e573231e6cf2',
            processingTime: det.processingTime || 0.45,
            modelVersion: det.modelVersion || 'DeepShield Engine',
            pdfDownloadUrl: det.pdfDownloadUrl || `/api/reports/download/report.pdf`,
            jsonDownloadUrl: det.jsonDownloadUrl || `/api/reports/download/report.json`,
          });
        }
      });

      const list = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setScans(list);
    } catch (err: any) {
      console.warn('[Analytics Load Error]:', err);
      setError('Unable to load telemetry database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user?.id]);

  const audioScans = scans.filter((s) => s.mediaType === 'audio' || (!s.mediaType && s.fileName?.match(/\.(wav|mp3|flac|m4a|aac|ogg)$/i)));
  const imageScans = scans.filter((s) => s.mediaType === 'image' || s.fileName?.match(/\.(jpg|jpeg|png|webp)$/i));
  const videoScans = scans.filter((s) => s.mediaType === 'video' || s.fileName?.match(/\.(mp4|mov|avi|webm)$/i));

  const audioAiCount = audioScans.filter((s) => s.verdict.toUpperCase().includes('AI') || s.verdict.toUpperCase().includes('DEEPFAKE') || s.threatLevel === 'HIGH' || s.threatLevel === 'CRITICAL').length;
  const audioNaturalCount = audioScans.length - audioAiCount;

  const imageAiCount = imageScans.filter((s) => s.verdict.toUpperCase().includes('AI') || s.verdict.toUpperCase().includes('DEEPFAKE') || s.threatLevel === 'HIGH' || s.threatLevel === 'CRITICAL').length;
  const imageUncertainCount = imageScans.filter((s) => s.verdict === 'Uncertain' || s.threatLevel === 'MEDIUM').length;
  const imageNaturalCount = imageScans.length - imageAiCount - imageUncertainCount;

  const videoAiCount = videoScans.filter((s) => s.verdict.toUpperCase().includes('AI') || s.verdict.toUpperCase().includes('DEEPFAKE') || s.threatLevel === 'HIGH' || s.threatLevel === 'CRITICAL').length;
  const videoNaturalCount = videoScans.length - videoAiCount;

  const totalAudioScans = audioScans.length;
  const totalImageScans = imageScans.length;
  const totalVideoScans = videoScans.length;
  const totalAiDetections = audioAiCount + imageAiCount + videoAiCount;
  const totalNaturalDetections = audioNaturalCount + imageNaturalCount + videoNaturalCount;
  const totalUncertainDetections = imageUncertainCount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto font-sans text-[#282B4A]">
      {/* Title & Header */}
      <div className="rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] inline-flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#014BAA]" />
              Multi-Modal Intelligence Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#014BAA] tracking-tight flex items-center gap-3">
            <PieChart className="w-8 h-8 text-[#014BAA]" /> Multi-Modal Detection Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#5A5E7A] mt-1.5 max-w-2xl leading-relaxed">
            Unified telemetry overview across DeepShield's three independent detection engines: Audio, Image, and Video.
          </p>
        </div>

        <button
          onClick={fetchAnalyticsData}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] hover:bg-[#D4E6FF] transition-all flex items-center gap-2 self-start md:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
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

      {/* TOP-LEVEL SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider block text-[#5A5E7A]">AUDIO SCANS</span>
          <p className="text-2xl font-black font-mono text-[#014BAA]">{totalAudioScans}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider block text-[#5A5E7A]">IMAGE SCANS</span>
          <p className="text-2xl font-black font-mono text-[#014BAA]">{totalImageScans}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider block text-[#5A5E7A]">VIDEO SCANS</span>
          <p className="text-2xl font-black font-mono text-[#014BAA]">{totalVideoScans}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-red-200 shadow-card text-center space-y-1">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">TOTAL AI CLONES</span>
          <p className="text-2xl font-black text-red-600 font-mono">{totalAiDetections}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-emerald-200 shadow-card text-center space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">TOTAL NATURAL</span>
          <p className="text-2xl font-black text-emerald-600 font-mono">{totalNaturalDetections}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-card text-center space-y-1">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">TOTAL UNCERTAIN</span>
          <p className="text-2xl font-black text-amber-600 font-mono">{totalUncertainDetections}</p>
        </div>
      </div>

      {/* THREE MODALITY ANALYTICS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Audio Analytics */}
        <div className="p-6 rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6F0FF] pb-3">
              <div className="flex items-center gap-2.5">
                <FileAudio className="w-5 h-5 text-[#014BAA]" />
                <h3 className="font-extrabold text-base text-[#282B4A]">Voice Audio Analytics</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] font-mono">
                WavLM Engine
              </span>
            </div>

            <p className="text-xs text-[#5A5E7A] leading-relaxed">
              Evaluates spectral pitch, 64-band FFT, and WavLM-base neural weights to identify synthetic voice clones.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
              <div className="p-3 rounded-2xl bg-[#F8F3F0] border border-[#E5D8D0] space-y-1">
                <span className="text-[9px] uppercase block font-semibold text-[#5A5E7A]">Total</span>
                <span className="text-lg font-bold block text-[#282B4A]">{totalAudioScans}</span>
              </div>
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 space-y-1">
                <span className="text-[9px] text-red-600 uppercase block font-semibold">AI Voice</span>
                <span className="text-lg font-bold text-red-600 block">{audioAiCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[9px] text-emerald-700 uppercase block font-semibold">Natural</span>
                <span className="text-lg font-bold text-emerald-600 block">{audioNaturalCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] border-t border-[#E6F0FF] flex items-center justify-between text-[#5A5E7A]">
            <span>Model: DavidCombei/wavLM-base</span>
            <span className="font-bold text-[#014BAA]">16kHz Mono</span>
          </div>
        </div>

        {/* 2. Image Analytics */}
        <div className="p-6 rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6F0FF] pb-3">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-[#014BAA]" />
                <h3 className="font-extrabold text-base text-[#282B4A]">Image Vision Analytics</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDF1F5] text-[#B83264] border border-[#F4B6CC] font-mono">
                ConvNeXtV2
              </span>
            </div>

            <p className="text-xs text-[#5A5E7A] leading-relaxed">
              Evaluates multi-scale focal patches and full image canvas using ConvNeXtV2-Base Phase-2 weights.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
              <div className="p-3 rounded-2xl bg-[#F8F3F0] border border-[#E5D8D0] space-y-1">
                <span className="text-[9px] uppercase block font-semibold text-[#5A5E7A]">Total</span>
                <span className="text-lg font-bold block text-[#282B4A]">{totalImageScans}</span>
              </div>
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 space-y-1">
                <span className="text-[9px] text-red-600 uppercase block font-semibold">AI Image</span>
                <span className="text-lg font-bold text-red-600 block">{imageAiCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[9px] text-emerald-700 uppercase block font-semibold">Natural</span>
                <span className="text-lg font-bold text-emerald-600 block">{imageNaturalCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] border-t border-[#E6F0FF] flex items-center justify-between text-[#5A5E7A]">
            <span>Model: xRayon-ConvNeXtV2-Phase2</span>
            <span className="font-bold text-[#014BAA]">380×380 Vision</span>
          </div>
        </div>

        {/* 3. Video Analytics */}
        <div className="p-6 rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6F0FF] pb-3">
              <div className="flex items-center gap-2.5">
                <Film className="w-5 h-5 text-[#014BAA]" />
                <h3 className="font-extrabold text-base text-[#282B4A]">Video Stream Analytics</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] font-mono">
                XceptionNet
              </span>
            </div>

            <p className="text-xs text-[#5A5E7A] leading-relaxed">
              Samples adaptive frame sequences, detects face crops with RetinaFace, and runs weighted ensemble voting.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
              <div className="p-3 rounded-2xl bg-[#F8F3F0] border border-[#E5D8D0] space-y-1">
                <span className="text-[9px] uppercase block font-semibold text-[#5A5E7A]">Total</span>
                <span className="text-lg font-bold block text-[#282B4A]">{totalVideoScans}</span>
              </div>
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 space-y-1">
                <span className="text-[9px] text-red-600 uppercase block font-semibold">AI Video</span>
                <span className="text-lg font-bold text-red-600 block">{videoAiCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-[9px] text-emerald-700 uppercase block font-semibold">Natural</span>
                <span className="text-lg font-bold text-emerald-600 block">{videoNaturalCount}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] border-t border-[#E6F0FF] flex items-center justify-between text-[#5A5E7A]">
            <span>Model: Xception / EfficientNet-B7</span>
            <span className="font-bold text-[#014BAA]">Ensemble Voting</span>
          </div>
        </div>
      </div>
    </div>
  );
};
