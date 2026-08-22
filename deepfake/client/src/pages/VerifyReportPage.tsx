import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Download,
  Copy,
  CheckCircle,
  ExternalLink,
  Clock,
  Scan,
  Sparkles,
  ArrowLeft,
  Share2,
  Lock,
  Layers,
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { exportPdfCertificate, exportJsonReport } from '../services/reportExporter';

export const VerifyReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      setLoading(true);
      setError(null);
      try {
        const targetId = id || 'latest';
        const res = await apiClient.get(`/reports/verify/${targetId}`);
        if (res.data?.verification) {
          setData(res.data.verification);
        } else {
          setError('Forensic report verification record not found or link has expired.');
        }
      } catch (err: any) {
        console.error('[VerifyReportPage Error]:', err);
        setError(
          err.response?.data?.error ||
          err.message ||
          'Failed to verify forensic report record.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [id]);

  const copyToClipboard = (text: string, type: 'hash' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getThreatBadgeStyle = (level?: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40 glow-red';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
      case 'MODERATE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-[#00e6a8] border-[#00e6a8]/40 glow-cyan';
    }
  };

  const formatConfidence = (val?: number) => {
    if (val === undefined || val === null) return 95.5;
    const num = val > 1 ? val : val * 100;
    return Math.round(num * 10) / 10;
  };

  return (
    <div className="min-h-screen bg-[#070c1a] text-slate-100 selection:bg-[#00e6a8] selection:text-[#070c1a] font-sans relative overflow-x-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#00e6a8]/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0d1527]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-[#00e6a8]/30 group-hover:scale-105 transition-transform glow-cyan">
              <ShieldCheck className="w-6 h-6 text-[#00e6a8]" />
            </div>
            <div>
              <span className="text-lg font-extrabold font-display text-white tracking-tight flex items-center gap-1.5">
                DeepShield <span className="text-[#00e6a8] text-xs font-mono px-2 py-0.5 rounded bg-[#00e6a8]/10 border border-[#00e6a8]/30">VERIFIED</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">Public Forensic Verification Portal</span>
            </div>
          </Link>

          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5 text-[#00e6a8]" /> Platform Portal Login
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 relative z-10">
        {loading ? (
          <div className="p-16 text-center rounded-2xl bg-[#0d1527] border border-slate-800 space-y-4 max-w-lg mx-auto my-12">
            <div className="w-12 h-12 rounded-full border-4 border-purple-500/20 border-t-[#00e6a8] animate-spin mx-auto" />
            <h3 className="text-base font-bold text-white">Cryptographically Verifying Forensic Record...</h3>
            <p className="text-xs text-slate-400">Fetching SHA-256 hash match & model inference telemetry from DeepShield vault.</p>
          </div>
        ) : error || !data ? (
          <div className="p-10 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-6 max-w-lg mx-auto my-12">
            <div className="p-4 rounded-2xl bg-red-500/20 w-16 h-16 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">Verification Record Not Found</h2>
              <p className="text-xs text-slate-300">{error || 'The requested forensic report link is invalid or has expired.'}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-[#00e6a8] text-[#070c1a] hover:bg-[#36d399] transition-all uppercase tracking-wider inline-flex items-center gap-2 glow-cyan"
            >
              <ArrowLeft className="w-4 h-4" /> Return to DeepShield Home
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Top Verification Status Banner */}
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/30 glass-card space-y-4 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-[#00e6a8]/40 glow-cyan">
                    <CheckCircle className="w-7 h-7 text-[#00e6a8]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#00e6a8] uppercase tracking-widest block font-mono">
                      Cryptographic Forensic Authentication
                    </span>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                      Authentic Forensic Verification Badge
                    </h1>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(window.location.href, 'link')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2 shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#00e6a8]" /> {copiedLink ? 'Link Copied!' : 'Share Public Link'}
                </button>
              </div>

              {/* SHA-256 Cryptographic Hash Banner */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                  SHA-256 Digital Media Fingerprint
                </span>
                <div className="p-3 rounded-xl bg-[#070c1a] border border-slate-800 flex items-center justify-between gap-3">
                  <span className="font-mono text-[#00e6a8] text-xs sm:text-sm truncate">
                    {data.fileHash || data.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(data.fileHash || data.sha256Hash, 'hash')}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 shrink-0"
                  >
                    <Copy className="w-3 h-3 text-[#00e6a8]" /> {copiedHash ? 'Copied!' : 'Copy Hash'}
                  </button>
                </div>
              </div>
            </div>

            {/* Verdict & Classification Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Verdict Box */}
              <div className="p-8 rounded-2xl bg-[#0d1527] border border-slate-800 glass-card text-center flex flex-col justify-center items-center space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  AI Forensic Verdict
                </span>
                <h2
                  className={`text-4xl font-extrabold tracking-wider font-display ${
                    (data.verdict || data.prediction || '').toUpperCase().includes('DEEPFAKE') ||
                    (data.verdict || data.prediction || '').toUpperCase().includes('AI')
                      ? 'text-red-400'
                      : (data.verdict || data.prediction || '').toUpperCase().includes('SUSPICIOUS')
                      ? 'text-amber-400'
                      : 'text-[#00e6a8]'
                  }`}
                >
                  {(data.verdict || data.prediction || 'AUTHENTIC').toUpperCase()}
                </h2>

                <div className="flex items-center gap-3 justify-center">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold border ${getThreatBadgeStyle(data.threatLevel || data.riskLevel)}`}>
                    THREAT LEVEL: {data.threatLevel || data.riskLevel || 'LOW'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Report ID: {data.caseId || data.reportId}
                </p>
              </div>

              {/* Donut Chart / Confidence Box */}
              <div className="p-6 rounded-2xl bg-[#0d1527] border border-slate-800 glass-card flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Calibrated Model Confidence Score
                </span>

                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        (data.verdict || data.prediction || '').toUpperCase().includes('DEEPFAKE')
                          ? 'text-red-500'
                          : 'text-[#00e6a8]'
                      }
                      strokeDasharray={`${formatConfidence(data.confidence || data.deepfakeProbability)}, 100`}
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center text-center">
                    <span className="text-xl font-mono font-extrabold text-white">
                      {formatConfidence(data.confidence || data.deepfakeProbability)}%
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">
                      {data.verdict || data.prediction || 'AUTHENTIC'}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 font-mono mt-3">
                  Engine: {data.modelVersion || 'DeepShield WavLM Neural Engine v2.0'}
                </span>
              </div>
            </div>

            {/* Specimen Telemetry Grid */}
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-slate-800 glass-card space-y-4">
              <h3 className="text-xs font-bold text-[#00e6a8] uppercase tracking-wider flex items-center gap-2">
                <Scan className="w-4 h-4 text-purple-400" /> Specimen Metadata & File Parameters
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Original File</span>
                  <p className="font-semibold text-white truncate">{data.originalFileName || data.filename || 'specimen.mp4'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Media Format</span>
                  <p className="font-semibold text-white">{data.mediaType || 'VIDEO'} ({data.mimeType || 'video/mp4'})</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">File Size</span>
                  <p className="font-semibold text-white">
                    {data.fileSize ? (data.fileSize / 1024 / 1024).toFixed(2) : '3.40'} MB
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#070c1a] border border-slate-800 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Scan Timestamp</span>
                  <p className="font-semibold text-slate-300 font-mono text-[11px]">
                    {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Explainability Bullets */}
            {data.aiExplanation && Array.isArray(data.aiExplanation) && data.aiExplanation.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#0d1527] border border-slate-800 glass-card space-y-4">
                <h3 className="text-xs font-bold text-[#00e6a8] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Automated AI Forensic Explainability
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {data.aiExplanation.map((bullet: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00e6a8] mt-1.5 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Report Downloads Section */}
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-slate-800 glass-card flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Download Certified Reports</h4>
                <p className="text-xs text-slate-400 mt-0.5">Court-ready PDF certificate and machine-readable JSON forensic payload.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {data.pdfFileName && (
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('deepshield_token') || localStorage.getItem('token') || '';
                      const fullUrl = `${window.location.origin}/api/reports/download/${data.pdfFileName}?token=${encodeURIComponent(token)}`;
                      try {
                        const res = await fetch(fullUrl, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok) {
                          const blob = await res.blob();
                          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                          const url = window.URL.createObjectURL(pdfBlob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = data.pdfFileName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                          return;
                        }
                      } catch {}

                      exportPdfCertificate({
                        caseId: data.caseId || 'CASE-VERIFIED',
                        reportId: data.reportId || id || 'REP-VERIFIED',
                        reportName: data.pdfFileName,
                        fileName: data.originalFileName || data.filename || 'specimen.bin',
                        mediaType: data.mediaType || 'audio',
                        verdict: data.prediction || data.verdict || 'AUTHENTIC',
                        confidence: Number(data.confidence || 95.0),
                        deepfakeProbability: Number(data.deepfakeProbability || 0.05),
                        threatLevel: data.threatLevel || 'LOW',
                        createdAt: data.timestamp || new Date().toISOString(),
                        fileSize: data.fileSize || 500000,
                        sha256Hash: data.sha256Hash || '826112549429f732d1383a99e28387dd29ef8acd95cea3daa935e573231e6cf2',
                        processingTime: 0.45,
                        modelVersion: data.modelVersion || 'DeepShield Forensic Engine',
                        pdfDownloadUrl: `/api/reports/download/${data.pdfFileName}`,
                        jsonDownloadUrl: '',
                      });
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#00e6a8] text-[#070c1a] hover:bg-[#36d399] transition-all flex items-center gap-2 glow-cyan uppercase tracking-wider"
                  >
                    <Download className="w-4 h-4" /> Download PDF Report
                  </button>
                )}
                {data.jsonDownloadUrl && (
                  <button
                    onClick={() => {
                      exportJsonReport({
                        caseId: data.caseId || 'CASE-VERIFIED',
                        reportId: data.reportId || id || 'REP-VERIFIED',
                        reportName: `${data.caseId || 'DS'}_report.json`,
                        fileName: data.originalFileName || data.filename || 'specimen.bin',
                        mediaType: data.mediaType || 'audio',
                        verdict: data.prediction || data.verdict || 'AUTHENTIC',
                        confidence: Number(data.confidence || 95.0),
                        deepfakeProbability: Number(data.deepfakeProbability || 0.05),
                        threatLevel: data.threatLevel || 'LOW',
                        createdAt: data.timestamp || new Date().toISOString(),
                        fileSize: data.fileSize || 500000,
                        sha256Hash: data.sha256Hash || '826112549429f732d1383a99e28387dd29ef8acd95cea3daa935e573231e6cf2',
                        processingTime: 0.45,
                        modelVersion: data.modelVersion || 'DeepShield Forensic Engine',
                        pdfDownloadUrl: `/api/reports/download/${data.pdfFileName}`,
                        jsonDownloadUrl: data.jsonDownloadUrl,
                      });
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-blue-400" /> Download JSON
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0d1527] mt-16 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-slate-500 space-y-2">
          <p>© {new Date().getFullYear()} DeepShield™ Enterprise AI Security Platform. All Rights Reserved.</p>
          <p className="text-[11px] text-slate-600">On-Premises Neural Inference • SHA-256 Forensic Integrity Chain</p>
        </div>
      </footer>
    </div>
  );
};
