import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import {
  ShieldAlert,
  Activity,
  ShieldCheck,
  BarChart2,
  Clock,
  ArrowUpRight,
  Upload,
  RefreshCw,
  FileAudio,
  Film,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Shield,
  CheckCircle,
  AlertTriangle,
  Scan,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLocalScanHistory } from '../services/scanHistoryService';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const handleDirectImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      navigate('/image-detection', { state: { preselectedFile: file } });
    }
  };

  const handleDirectVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      navigate('/video-detection', { state: { preselectedFile: file } });
    }
  };

  const handleDirectVoiceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      navigate('/upload', { state: { preselectedFile: file } });
    }
  };

  const [summaryData, setSummaryData] = useState<any>({
    totalScans: 0,
    authenticCount: 0,
    aiCount: 0,
    avgConfidence: 0,
    duplicateCount: 0,
    threatRatio: 0,
  });

  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const summaryRes = await apiClient.get('/detect/analytics/summary').catch(() => null);
      const rawSummary = summaryRes?.data?.summary || summaryRes?.data || {};

      let totalScans = rawSummary.totalScans || 0;
      let aiCount = rawSummary.deepfakesDetected || rawSummary.deepfakeFiles || rawSummary.aiCount || 0;
      let authenticCount = rawSummary.authenticCount || rawSummary.authenticFiles || 0;
      let avgConfidence = rawSummary.avgConfidence || 0;

      const historyRes = await apiClient.get('/detect/history?limit=6').catch(() => null);
      const itemsList = historyRes?.data?.items || historyRes?.data?.history || historyRes?.data?.detections || [];
      let mapped = itemsList.map((item: any) => ({
        id: item.id,
        fileName: item.fileName || item.originalFileName || 'specimen_sample.wav',
        caseId: item.caseId || (item.id ? `CASE-${item.id.substring(0, 6).toUpperCase()}` : 'DS-001'),
        mediaType: item.mediaType || (item.fileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? 'image' : item.fileName?.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'audio'),
        riskLevel: item.riskLevel || (item.status === 'DEEPFAKE' ? 'HIGH' : 'LOW'),
        confidence: item.confidence ?? Math.round((item.deepfakeProbability || 0.1) * 100),
        deepfakeProbability: item.deepfakeProbability ?? 0.05,
        verdict: item.verdict || item.status || (item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH' ? 'AI Manipulated' : 'Authentic Natural'),
        createdAt: item.createdAt,
      }));

      // Fallback to local scan history if backend history is empty
      const localScans = [
        ...getLocalScanHistory(user?.id),
        ...getLocalScanHistory(),
      ];

      if (mapped.length === 0 && localScans.length > 0) {
        mapped = localScans.slice(0, 6).map((loc) => ({
          id: loc.reportId || loc.caseId,
          fileName: loc.fileName,
          caseId: loc.caseId,
          mediaType: loc.mediaType || 'audio',
          riskLevel: loc.threatLevel,
          confidence: loc.confidence,
          deepfakeProbability: loc.deepfakeProbability || (loc.verdict?.includes('AI') ? 0.95 : 0.05),
          verdict: loc.verdict,
          createdAt: loc.createdAt,
        }));
        totalScans = Math.max(totalScans, localScans.length);
        aiCount = Math.max(aiCount, localScans.filter(s => s.verdict.toUpperCase().includes('AI') || s.verdict.toUpperCase().includes('DEEPFAKE')).length);
        authenticCount = Math.max(authenticCount, localScans.filter(s => s.verdict.toUpperCase().includes('GENUINE') || s.verdict.toUpperCase().includes('NATURAL') || s.verdict.toUpperCase().includes('REAL')).length);
        avgConfidence = 95.0;
      }

      const threatRatio = totalScans > 0 ? ((aiCount / totalScans) * 100).toFixed(1) : '0';

      setSummaryData({
        totalScans,
        authenticCount,
        aiCount,
        avgConfidence: Number(avgConfidence).toFixed(1),
        duplicateCount: rawSummary.duplicateCount || 0,
        threatRatio,
      });

      setRecentHistory(mapped);
    } catch (err) {
      console.warn('Dashboard telemetry fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMediaBadge = (mediaType?: string) => {
    switch (mediaType) {
      case 'image':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE]">
            <ImageIcon className="w-3 h-3" /> Image
          </span>
        );
      case 'video':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FDF1F5] text-[#B83264] border border-[#F4B6CC]">
            <Film className="w-3 h-3" /> Video
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE]">
            <FileAudio className="w-3 h-3" /> Voice
          </span>
        );
    }
  };

  const isAiVerdict = (verdict?: string) => {
    if (!verdict) return false;
    const v = verdict.toUpperCase();
    return v.includes('AI') || v.includes('DEEPFAKE') || v.includes('CLONE') || v.includes('SYNTHETIC');
  };

  return (
    <div className="p-3 xs:p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl 2xl:max-w-[1600px] mx-auto font-sans text-[#282B4A] w-full">
      {/* 1. FORENSIC TELEMETRY & METRICS (TOP SECTION) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#014BAA] animate-pulse" />
                Cybersecurity Threat Radar Active
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FDF1F5] text-[#B83264] border border-[#F4B6CC] inline-flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#B83264]" />
                Multi-Modal AI v2.4
              </span>
            </div>
            <h1 className="text-xl xs:text-2xl sm:text-3xl font-extrabold font-display text-[#014BAA] flex items-center gap-2.5">
              <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-[#014BAA] shrink-0" />
              <span>Forensic Telemetry & Metrics</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5A5E7A] mt-0.5">
              Real-time aggregate detection metrics across all verified media scans
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={fetchDashboardData}
              className="p-2.5 sm:p-3 rounded-xl border border-[#BFDAFE] bg-[#E6F0FF] text-[#014BAA] hover:bg-[#D4E6FF] transition-all flex items-center justify-center shadow-sm min-h-[44px] min-w-[44px] touch-manipulation cursor-pointer"
              title="Refresh telemetry"
              aria-label="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/history"
              className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#014BAA] border-1.5 border-[#014BAA] hover:bg-[#E6F0FF] transition-all flex items-center gap-1.5 sm:gap-2 shadow-sm min-h-[44px] touch-manipulation"
            >
              <Clock className="w-4 h-4" /> View History
            </Link>
            <Link
              to="/upload"
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-extrabold bg-[#014BAA] text-white hover:bg-[#013D8B] transition-all flex items-center gap-1.5 sm:gap-2 shadow-royal min-h-[44px] touch-manipulation"
            >
              <Upload className="w-4 h-4" /> Start Scan
            </Link>
          </div>
        </div>

        {/* 5 Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {/* Card 1: Total Scans */}
          <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#5A5E7A]">
                Total Scans
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#E6F0FF] text-[#014BAA] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#014BAA]">
              {summaryData.totalScans}
            </div>
            <span className="text-[11px] font-semibold block text-[#5A5E7A]">
              Processed Specimens
            </span>
          </div>

          {/* Card 2: Authentic */}
          <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#5A5E7A]">
                Authentic Media
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600">
              {summaryData.authenticCount}
            </div>
            <span className="text-[11px] font-bold block text-emerald-700">
              Verified Genuine
            </span>
          </div>

          {/* Card 3: AI Detected */}
          <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#5A5E7A]">
                AI Clones / Fakes
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-red-600">
              {summaryData.aiCount}
            </div>
            <span className="text-[11px] font-bold block text-red-600">
              {summaryData.threatRatio}% Threat Ratio
            </span>
          </div>

          {/* Card 4: Avg Confidence */}
          <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card space-y-2 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#5A5E7A]">
                Avg Confidence
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#E6F0FF] text-[#014BAA] flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#014BAA]">
              {summaryData.avgConfidence}%
            </div>
            <span className="text-[11px] font-semibold block text-[#5A5E7A]">
              Calibrated Precision
            </span>
          </div>

          {/* Card 5: Engine Status */}
          <div className="p-5 rounded-2xl bg-white border border-[#E6F0FF] shadow-card space-y-2 transition-all col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#5A5E7A]">
                Neural Engines
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#FDF1F5] text-[#B83264] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#282B4A]">
              3 Active
            </div>
            <span className="text-[11px] font-bold block text-[#014BAA]">
              Image • Video • Audio
            </span>
          </div>
        </div>
      </div>

      {/* 2. THREE SEPARATE DETECTION OPTIONS (Image, Video, Voice) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#014BAA] flex items-center gap-2.5">
              <Scan className="w-6 h-6 text-[#014BAA]" />
              AI Deepfake Detection Modules
            </h2>
            <p className="text-xs sm:text-sm text-[#5A5E7A] mt-0.5">
              Select or upload a specimen directly to initiate multi-modal neural deepfake analysis
            </p>
          </div>
          <span className="hidden sm:inline-block text-xs font-bold text-[#014BAA] bg-[#E6F0FF] px-3 py-1 rounded-full border border-[#BFDAFE]">
            3 Engines Ready
          </span>
        </div>

        {/* Hidden inputs for direct upload from Dashboard */}
        <input
          ref={imageInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/*"
          onChange={handleDirectImageSelect}
          className="hidden"
          id="dashboard-image-input"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept=".mp4,.mov,.avi,.mkv,.webm,video/*"
          onChange={handleDirectVideoSelect}
          className="hidden"
          id="dashboard-video-input"
        />
        <input
          ref={voiceInputRef}
          type="file"
          accept=".wav,.mp3,.flac,.aac,.m4a,.ogg,audio/*"
          onChange={handleDirectVoiceSelect}
          className="hidden"
          id="dashboard-voice-input"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card A: Image Detection */}
          <div className="rounded-2xl bg-white border border-[#E6F0FF] p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E6F0FF] rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#014BAA] text-white flex items-center justify-center shadow-royal">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#FDF1F5] text-[#B83264] border border-[#F4B6CC]">
                  ConvNeXtV2
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-[#282B4A] group-hover:text-[#014BAA] transition-colors">
                  Image Deepfake Detection
                </h3>
                <p className="text-xs text-[#5A5E7A] mt-1.5 leading-relaxed">
                  Identify AI-generated portraits, face swaps, diffusion artifacts, and synthetic photo alterations with high-precision neural inference.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-[#5A5E7A]">
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">JPG</span>
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">PNG</span>
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">WEBP</span>
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">JPEG</span>
              </div>
            </div>

            <div className="pt-6 relative z-10 space-y-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full py-3 rounded-xl bg-[#014BAA] text-white hover:bg-[#013D8B] font-bold text-xs flex items-center justify-center gap-2 shadow-royal transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Select & Upload Image</span>
              </button>
              <Link
                to="/image-detection"
                className="w-full py-2 rounded-xl bg-[#E6F0FF] text-[#014BAA] hover:bg-[#D4E6FF] font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-[#BFDAFE]"
              >
                <span>Open Image Studio</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card B: Video Detection */}
          <div className="rounded-2xl bg-white border border-[#E6F0FF] p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FDF1F5] rounded-bl-full -z-0 opacity-60 group-hover:scale-110 transition-transform" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#014BAA] text-white flex items-center justify-center shadow-royal">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE]">
                  XceptionNet
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-[#282B4A] group-hover:text-[#014BAA] transition-colors">
                  Video Deepfake Detection
                </h3>
                <p className="text-xs text-[#5A5E7A] mt-1.5 leading-relaxed">
                  Extract temporal frame sequences, track facial bounding boxes, and classify video deepfakes with multi-frame ensemble voting.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-[#5A5E7A]">
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">MP4</span>
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">MOV</span>
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">WEBM</span>
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">AVI</span>
              </div>
            </div>

            <div className="pt-6 relative z-10 space-y-2">
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full py-3 rounded-xl bg-[#014BAA] text-white hover:bg-[#013D8B] font-bold text-xs flex items-center justify-center gap-2 shadow-royal transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Select & Upload Video</span>
              </button>
              <Link
                to="/video-detection"
                className="w-full py-2 rounded-xl bg-[#E6F0FF] text-[#014BAA] hover:bg-[#D4E6FF] font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-[#BFDAFE]"
              >
                <span>Open Video Studio</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card C: Voice Detection */}
          <div className="rounded-2xl bg-white border border-[#E6F0FF] p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E6F0FF] rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform" />
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#014BAA] text-white flex items-center justify-center shadow-royal">
                  <FileAudio className="w-6 h-6 text-white" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE]">
                  WavLM-base
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-[#282B4A] group-hover:text-[#014BAA] transition-colors">
                  Voice Deepfake Detection
                </h3>
                <p className="text-xs text-[#5A5E7A] mt-1.5 leading-relaxed">
                  Evaluate acoustic speech specimens, calculate 64-band FFT and pitch variations, and detect AI voice clone patterns.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-[#5A5E7A]">
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">WAV</span>
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">MP3</span>
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">FLAC</span>
                <span className="px-2 py-0.5 rounded bg-[#F8F3F0] border border-[#E5D8D0]">M4A</span>
              </div>
            </div>

            <div className="pt-6 relative z-10 space-y-2">
              <button
                type="button"
                onClick={() => voiceInputRef.current?.click()}
                className="w-full py-3 rounded-xl bg-[#014BAA] text-white hover:bg-[#013D8B] font-bold text-xs flex items-center justify-center gap-2 shadow-royal transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Select & Upload Voice</span>
              </button>
              <Link
                to="/upload"
                className="w-full py-2 rounded-xl bg-[#E6F0FF] text-[#014BAA] hover:bg-[#D4E6FF] font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-[#BFDAFE]"
              >
                <span>Open Voice Studio</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT ANALYSIS HISTORY TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold font-display text-[#014BAA] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#014BAA]" />
              Recent Detection Analysis Log
            </h2>
            <p className="text-xs text-[#5A5E7A] mt-0.5">
              Latest analyzed media specimens with verified AI classification verdicts
            </p>
          </div>
          <Link
            to="/history"
            className="text-xs font-bold text-[#014BAA] hover:underline flex items-center gap-1 bg-[#E6F0FF] px-3 py-1.5 rounded-xl border border-[#BFDAFE] transition-all"
          >
            <span>Full Archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl bg-white border border-[#E6F0FF] shadow-card overflow-hidden">
          {/* Mobile Stacked Cards (Visible on screens < 768px) */}
          <div className="block md:hidden divide-y divide-[#E6F0FF] p-2">
            {loading ? (
              <div className="py-8 text-center text-[#5A5E7A] text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#014BAA]" />
                <span>Loading recent specimens...</span>
              </div>
            ) : recentHistory.length === 0 ? (
              <div className="py-8 text-center text-[#5A5E7A] text-xs px-4">
                <Shield className="w-8 h-8 text-[#014BAA]/40 mx-auto mb-2" />
                <span className="font-bold text-[#282B4A] block">No recent scans found</span>
                <p className="text-[11px] text-[#5A5E7A] mt-1">Upload a specimen to start generating telemetry.</p>
              </div>
            ) : (
              recentHistory.map((item) => {
                const isAi = isAiVerdict(item.verdict);
                return (
                  <div key={item.id} className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#014BAA]">{item.caseId}</span>
                      {getMediaBadge(item.mediaType)}
                    </div>
                    <div className="text-xs font-semibold text-[#282B4A] truncate" title={item.fileName}>
                      {item.fileName}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        {isAi ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-600 border border-red-200">
                            <ShieldAlert className="w-3 h-3 text-red-500" /> AI Generated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Authentic Natural
                          </span>
                        )}
                        <span className="ml-2 font-mono font-bold text-xs text-[#282B4A]">{item.confidence}%</span>
                      </div>
                      <Link
                        to="/history"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E6F0FF] text-[#014BAA] min-h-[36px]"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Tablet & Desktop Full Table (Visible on screens >= 768px) */}
          <div className="hidden md:block overflow-x-auto responsive-table-scroll">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E6F0FF] text-[#014BAA] font-extrabold uppercase tracking-wider text-[11px] border-b border-[#BFDAFE]">
                  <th className="py-3.5 px-4">Case ID</th>
                  <th className="py-3.5 px-4">Media</th>
                  <th className="py-3.5 px-4">Filename</th>
                  <th className="py-3.5 px-4">Verdict</th>
                  <th className="py-3.5 px-4">Confidence</th>
                  <th className="py-3.5 px-4">Analyzed At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F0FF]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#5A5E7A] text-xs">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#014BAA]" />
                        <span>Loading recent detection specimens...</span>
                      </div>
                    </td>
                  </tr>
                ) : recentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#5A5E7A] text-xs">
                      <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
                        <Shield className="w-8 h-8 text-[#014BAA]/40" />
                        <span className="font-bold text-[#282B4A]">No recent scans found</span>
                        <p className="text-[11px] text-[#5A5E7A]">
                          Upload an image, video, or audio file to start generating real-time forensic detection telemetry.
                        </p>
                        <Link
                          to="/upload"
                          className="mt-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#014BAA] text-white hover:bg-[#013D8B] transition-all shadow-royal"
                        >
                          Analyze First Specimen
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentHistory.map((item) => {
                    const isAi = isAiVerdict(item.verdict);
                    return (
                      <tr key={item.id} className="hover:bg-[#F8F3F0]/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#014BAA]">
                          {item.caseId}
                        </td>
                        <td className="py-3 px-4">
                          {getMediaBadge(item.mediaType)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#282B4A] max-w-[200px] truncate" title={item.fileName}>
                          {item.fileName}
                        </td>
                        <td className="py-3 px-4">
                          {isAi ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-50 text-red-600 border border-red-200">
                              <ShieldAlert className="w-3 h-3 text-red-500" />
                              <span>AI Generated</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Authentic Natural</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#282B4A]">
                          {item.confidence}%
                        </td>
                        <td className="py-3 px-4 text-[#5A5E7A] text-[11px]">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to="/history"
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-[#E6F0FF] text-[#014BAA] hover:bg-[#D4E6FF] transition-all"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
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
    </div>
  );
};
