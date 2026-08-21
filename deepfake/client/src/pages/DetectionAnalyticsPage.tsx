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
  Info
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { getLocalScanHistory, ScanRecord } from '../services/scanHistoryService';

export const DetectionAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get local persistent history
      const localScans = getLocalScanHistory();

      // 2. Fetch backend records if available
      const [reportsRes, detectRes] = await Promise.all([
        apiClient.get('/reports/history').catch(() => ({ data: { reports: [] } })),
        apiClient.get('/detect/history?limit=100').catch(() => ({ data: { items: [] } })),
      ]);

      const reportsList: any[] = reportsRes.data?.reports || [];
      const detectList: any[] = detectRes.data?.items || [];

      // Merge into map by SHA256 hash or case ID
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
            reportName: rep.reportName || `report_${rep.caseId}.pdf`,
            fileName: rep.fileName || rep.originalFileName || 'specimen.bin',
            mediaType: mType,
            durationSeconds: rep.durationSeconds || rep.duration,
            verdict: isAi ? (mType === 'image' ? 'Likely AI Generated' : mType === 'video' ? 'AI GENERATED VIDEO' : 'AI GENERATED VOICE') : (mType === 'image' ? 'Likely Natural' : 'GENUINE'),
            confidence: rep.confidence ?? 95,
            threatLevel: (rep.threatLevel || (isAi ? 'HIGH' : 'LOW')).toUpperCase() as any,
            createdAt: rep.createdAt || new Date().toISOString(),
            fileSize: rep.fileSize || 500000,
            sha256Hash: rep.sha256Hash || '826112549429f732d1383a99e28387dd29ef8acd95cea3daa935e573231e6cf2',
            processingTime: rep.processingTime || 0.42,
            modelVersion: rep.modelVersion || (mType === 'image' ? 'xRayon-ConvNeXtV2-Phase2' : mType === 'video' ? 'Xception / EfficientNet Video Classifier' : 'DavidCombei/wavLM-base-Deepfake_V2'),
            pdfDownloadUrl: rep.pdfDownloadUrl || `/api/reports/download/report.pdf`,
            jsonDownloadUrl: rep.jsonDownloadUrl || `/api/reports/download/report.json`,
          });
        }
      });

      detectList.forEach((det: any) => {
        const key = det.fileHash || det.sha256Hash || det.id;
        if (!mergedMap.has(key)) {
          const rawConf = det.confidence ?? det.deepfakeProbability ?? 0.95;
          const confPct = rawConf > 1 ? Math.round(rawConf) : Math.round(rawConf * 100);
          const isAi = (det.verdict || det.status || '').toUpperCase().includes('DEEPFAKE') ||
                       (det.verdict || det.status || '').toUpperCase().includes('AI');
          const mType = det.mediaType || (det.originalFileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : det.originalFileName?.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'audio');

          mergedMap.set(key, {
            caseId: `CASE-${det.id?.slice(0, 6).toUpperCase() || 'SCAN'}`,
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
          });
        }
      });

      const allList = Array.from(mergedMap.values());
      setScans(allList);
    } catch (err: any) {
      console.error('[Detection Analytics Error]:', err);
      setError('Unable to load detection analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Compute Modality Breakdown Statistics
  const audioScans = scans.filter((s) => s.mediaType === 'audio');
  const imageScans = scans.filter((s) => s.mediaType === 'image');
  const videoScans = scans.filter((s) => s.mediaType === 'video');

  // Audio Stats
  const audioAiCount = audioScans.filter((s) => s.verdict.toUpperCase().includes('AI') || s.verdict.toUpperCase().includes('DEEPFAKE')).length;
  const audioNaturalCount = audioScans.filter((s) => s.verdict.toUpperCase().includes('GENUINE') || s.verdict.toUpperCase().includes('NATURAL') || s.verdict.toUpperCase().includes('REAL')).length;

  // Image Stats
  const imageAiCount = imageScans.filter((s) => s.verdict === 'Likely AI Generated' || s.verdict.toUpperCase().includes('AI')).length;
  const imageNaturalCount = imageScans.filter((s) => s.verdict === 'Likely Natural' || s.verdict.toUpperCase().includes('NATURAL') || s.verdict.toUpperCase().includes('REAL')).length;
  const imageUncertainCount = imageScans.filter((s) => s.verdict === 'Uncertain').length;

  // Video Stats
  const videoAiCount = videoScans.filter((s) => s.verdict.toUpperCase().includes('AI') || s.verdict.toUpperCase().includes('DEEPFAKE')).length;
  const videoNaturalCount = videoScans.filter((s) => s.verdict.toUpperCase().includes('REAL') || s.verdict.toUpperCase().includes('NATURAL') || s.verdict.toUpperCase().includes('GENUINE')).length;
  const videoUncertainCount = videoScans.filter((s) => s.verdict === 'Uncertain').length;

  // Top Level Summaries
  const totalAudioScans = audioScans.length;
  const totalImageScans = imageScans.length;
  const totalVideoScans = videoScans.length;
  const totalAiDetections = audioAiCount + imageAiCount + videoAiCount;
  const totalNaturalDetections = audioNaturalCount + imageNaturalCount + videoNaturalCount;
  const totalUncertainDetections = imageUncertainCount + videoUncertainCount;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto selection:bg-[#00e6a8] selection:text-[#070c1a]">
      {/* Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#00e6a8] uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4 text-[#00e6a8]" /> Unified Multi-Modal Intelligence Telemetry
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-[#00e6a8] tracking-tight flex items-center gap-3">
            <PieChart className="w-8 h-8 text-[#00e6a8]" /> Multi-Modal Detection Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Comprehensive telemetry overview across DeepShield's three independent detection engines: Audio, Image, and Video.
          </p>
        </div>

        <button
          onClick={fetchAnalyticsData}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0d1527] hover:bg-slate-800 text-[#00e6a8] border border-[#00e6a8]/30 flex items-center gap-2 self-start md:self-auto transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Analytics
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

      {/* TOP-LEVEL SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card text-center space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">AUDIO SCANS</span>
          <p className="text-2xl font-black text-cyan-400 font-mono">{totalAudioScans}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card text-center space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">IMAGE SCANS</span>
          <p className="text-2xl font-black text-[#00e6a8] font-mono">{totalImageScans}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card text-center space-y-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">VIDEO SCANS</span>
          <p className="text-2xl font-black text-purple-400 font-mono">{totalVideoScans}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1527] border border-red-500/30 glass-card text-center space-y-1">
          <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider block">TOTAL AI / DEEPFAKE</span>
          <p className="text-2xl font-black text-red-400 font-mono">{totalAiDetections}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1527] border border-emerald-500/30 glass-card text-center space-y-1">
          <span className="text-[10px] font-extrabold text-[#00e6a8] uppercase tracking-wider block">TOTAL NATURAL</span>
          <p className="text-2xl font-black text-[#00e6a8] font-mono">{totalNaturalDetections}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1527] border border-amber-500/30 glass-card text-center space-y-1">
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">TOTAL UNCERTAIN</span>
          <p className="text-2xl font-black text-amber-400 font-mono">{totalUncertainDetections}</p>
        </div>
      </div>

      {/* THREE MODALITY SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. AUDIO DETECTION ANALYTICS CARD */}
        <div className="p-6 rounded-2xl bg-[#0d1527] border border-cyan-500/30 glass-card space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <FileAudio className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-base text-white">Audio Detection Analytics</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                WavLM Engine
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Evaluates spectral pitch, 64-band FFT, and WavLM-base neural weights to identify voice clones.
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2">
              <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                <span className="text-[9px] text-slate-400 uppercase block font-semibold">Total Scans</span>
                <span className="text-lg font-bold text-white block">{totalAudioScans}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                <span className="text-[9px] text-red-400 uppercase block font-semibold">AI Voice</span>
                <span className="text-lg font-bold text-red-400 block">{audioAiCount}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                <span className="text-[9px] text-[#00e6a8] uppercase block font-semibold">Natural Voice</span>
                <span className="text-lg font-bold text-[#00e6a8] block">{audioNaturalCount}</span>
              </div>
            </div>

            {/* Recent Audio Detections */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Recent Audio Detections</span>
              {audioScans.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#070c1a] border border-slate-800/60 text-center text-xs text-slate-500">
                  No audio detection records logged.
                </div>
              ) : (
                audioScans.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#070c1a] border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="truncate max-w-[150px]">
                      <span className="text-white font-semibold truncate block">{item.fileName}</span>
                      <span className="text-[9px] text-slate-400 block">{item.caseId}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.verdict.toUpperCase().includes('AI') ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-[#00e6a8] border border-[#00e6a8]/30'
                    }`}>
                      {item.verdict}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-800/80 flex items-center justify-between">
            <span>Primary Model: DavidCombei/wavLM-base-Deepfake_V2</span>
            <span className="text-cyan-400 font-bold">16kHz Mono</span>
          </div>
        </div>

        {/* 2. IMAGE DETECTION ANALYTICS CARD */}
        <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/30 glass-card space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-[#00e6a8]" />
                <h3 className="font-extrabold text-base text-white">Image Detection Analytics</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#00e6a8]/20 text-[#00e6a8] border border-[#00e6a8]/30 font-mono">
                xRayon ConvNeXtV2 Phase-2
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Evaluates multi-scale focal patches and full image canvas using ConvNeXtV2-Base Phase-2 weights.
            </p>

            <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono pt-2">
              <div className="p-2.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                <span className="text-[9px] text-slate-400 uppercase block font-semibold truncate">Total</span>
                <span className="text-base font-bold text-white block">{totalImageScans}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                <span className="text-[9px] text-red-400 uppercase block font-semibold truncate">AI</span>
                <span className="text-base font-bold text-red-400 block">{imageAiCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                <span className="text-[9px] text-[#00e6a8] uppercase block font-semibold truncate">Natural</span>
                <span className="text-base font-bold text-[#00e6a8] block">{imageNaturalCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                <span className="text-[9px] text-amber-400 uppercase block font-semibold truncate">Uncertain</span>
                <span className="text-base font-bold text-amber-400 block">{imageUncertainCount}</span>
              </div>
            </div>

            {/* Recent Image Detections */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Recent Image Detections</span>
              {imageScans.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#070c1a] border border-slate-800/60 text-center text-xs text-slate-500">
                  No image detection records logged.
                </div>
              ) : (
                imageScans.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#070c1a] border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="truncate max-w-[150px]">
                      <span className="text-white font-semibold truncate block">{item.fileName}</span>
                      <span className="text-[9px] text-slate-400 block">{item.caseId}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.verdict === 'Likely AI Generated' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : item.verdict === 'Uncertain' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-[#00e6a8] border border-[#00e6a8]/30'
                    }`}>
                      {item.verdict}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-800/80 flex items-center justify-between">
            <span>Primary Detector: xRayon/convnext-ai-images-detector</span>
            <span className="text-[#00e6a8] font-bold">Threshold 0.96</span>
          </div>
        </div>

        {/* 3. VIDEO DETECTION ANALYTICS CARD */}
        <div className="p-6 rounded-2xl bg-[#0d1527] border border-purple-500/30 glass-card space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Film className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-base text-white">Video Detection Analytics</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                Xception / EfficientNet
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Performs face tracking via RetinaFace/MTCNN and evaluates temporal frames for deepfake manipulations.
            </p>

            <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono pt-2">
              <div className="p-2.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                <span className="text-[9px] text-slate-400 uppercase block font-semibold truncate">Total</span>
                <span className="text-base font-bold text-white block">{totalVideoScans}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                <span className="text-[9px] text-red-400 uppercase block font-semibold truncate">AI / Fake</span>
                <span className="text-base font-bold text-red-400 block">{videoAiCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                <span className="text-[9px] text-[#00e6a8] uppercase block font-semibold truncate">Natural</span>
                <span className="text-base font-bold text-[#00e6a8] block">{videoNaturalCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                <span className="text-[9px] text-amber-400 uppercase block font-semibold truncate">Uncertain</span>
                <span className="text-base font-bold text-amber-400 block">{videoUncertainCount}</span>
              </div>
            </div>

            {/* Recent Video Detections */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Recent Video Detections</span>
              {videoScans.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#070c1a] border border-slate-800/60 text-center text-xs text-slate-500">
                  No video detection records logged.
                </div>
              ) : (
                videoScans.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-[#070c1a] border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="truncate max-w-[150px]">
                      <span className="text-white font-semibold truncate block">{item.fileName}</span>
                      <span className="text-[9px] text-slate-400 block">{item.caseId}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.verdict.toUpperCase().includes('AI') || item.verdict.toUpperCase().includes('DEEPFAKE') ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-[#00e6a8] border border-[#00e6a8]/30'
                    }`}>
                      {item.verdict}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-800/80 flex items-center justify-between">
            <span>Classifier: XceptionNet / EfficientNet-B7</span>
            <span className="text-purple-400 font-bold">DFDC Weights</span>
          </div>
        </div>

      </div>
    </div>
  );
};
