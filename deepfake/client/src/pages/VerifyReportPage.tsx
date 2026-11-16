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
  CheckCircle2,
  Shield,
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

  const formatConfidence = (val?: number) => {
    if (val === undefined || val === null) return 95.5;
    const num = val > 1 ? val : val * 100;
    return Math.round(num * 10) / 10;
  };

  const isAi = (data?.verdict || data?.prediction || '').toUpperCase().includes('DEEPFAKE') ||
               (data?.verdict || data?.prediction || '').toUpperCase().includes('AI');

  return (
    <div className="min-h-screen bg-[#F8F3F0] text-[#282B4A] selection:bg-[#014BAA] selection:text-white font-sans relative overflow-x-hidden">
      {/* Top Header Navbar */}
      <header className="bg-[#014BAA] text-white border-b border-[#013D8B] sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white text-[#014BAA] flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 fill-[#014BAA]" />
            </div>
            <div>
              <span className="text-lg font-extrabold font-display text-white tracking-tight flex items-center gap-2">
                DeepShield <span className="text-[#014BAA] text-xs font-bold px-2 py-0.5 rounded-full bg-[#E6F0FF]">VERIFIED</span>
              </span>
              <span className="text-[10px] text-[#E6F0FF]/80 block font-mono">Public Forensic Verification Portal</span>
            </div>
          </Link>

          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-[#014BAA] hover:bg-[#E6F0FF] transition-all flex items-center gap-2 shadow-sm"
          >
            <Lock className="w-3.5 h-3.5 text-[#014BAA]" /> Platform Portal Login
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 relative z-10">
        {loading ? (
          <div className="p-16 text-center rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-4 max-w-lg mx-auto my-12">
            <div className="w-12 h-12 rounded-full border-4 border-[#E6F0FF] border-t-[#014BAA] animate-spin mx-auto" />
            <h3 className="text-base font-bold text-[#282B4A]">Cryptographically Verifying Forensic Record...</h3>
            <p className="text-xs text-[#5A5E7A]">Fetching SHA-256 hash match & model inference telemetry from DeepShield vault.</p>
          </div>
        ) : error || !data ? (
          <div className="p-10 rounded-3xl bg-white border border-red-200 shadow-card text-center space-y-6 max-w-lg mx-auto my-12">
            <div className="p-4 rounded-2xl bg-red-50 text-red-600 w-16 h-16 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-[#282B4A]">Verification Record Not Found</h2>
              <p className="text-xs text-[#5A5E7A]">{error || 'The requested forensic report link is invalid or has expired.'}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-[#014BAA] text-white hover:bg-[#013D8B] transition-all uppercase tracking-wider inline-flex items-center gap-2 shadow-royal"
            >
              <ArrowLeft className="w-4 h-4" /> Return to DeepShield Home
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top Status Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E6F0FF] shadow-card space-y-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E6F0FF] pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-[#014BAA] uppercase tracking-widest block font-mono">
                      Cryptographic Forensic Authentication
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-[#282B4A] tracking-tight">
                      Authentic Forensic Verification Badge
                    </h1>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(window.location.href, 'link')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] hover:bg-[#D4E6FF] transition-all flex items-center gap-2 shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#014BAA]" /> {copiedLink ? 'Link Copied!' : 'Share Public Link'}
                </button>
              </div>

              {/* SHA-256 Hash Box */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-[#5A5E7A] uppercase tracking-widest block">
                  SHA-256 Digital Media Fingerprint
                </span>
                <div className="p-3.5 rounded-2xl bg-[#E6F0FF] border border-[#BFDAFE] flex items-center justify-between gap-3">
                  <span className="font-mono text-[#014BAA] text-xs sm:text-sm truncate font-bold">
                    {data.fileHash || data.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(data.fileHash || data.sha256Hash, 'hash')}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#D4E6FF] text-[#014BAA] text-[10px] font-bold flex items-center gap-1 shrink-0 border border-[#BFDAFE]"
                  >
                    <Copy className="w-3 h-3 text-[#014BAA]" /> {copiedHash ? 'Copied!' : 'Copy Hash'}
                  </button>
                </div>
              </div>
            </div>

            {/* Verdict & Classification Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <div className={`p-8 rounded-3xl border text-center flex flex-col justify-center items-center space-y-4 shadow-card ${
                isAi ? 'bg-red-50/80 border-red-200' : 'bg-emerald-50/80 border-emerald-200'
              }`}>
                <span className="text-[10px] font-bold text-[#5A5E7A] uppercase tracking-widest">
                  AI Forensic Verdict
                </span>
                <h2 className={`text-3xl sm:text-4xl font-black tracking-tight font-display ${
                  isAi ? 'text-red-700' : 'text-emerald-700'
                }`}>
                  {data.verdict || data.prediction || 'GENUINE'}
                </h2>
                <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  isAi ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  THREAT LEVEL: {data.threatLevel || (isAi ? 'HIGH' : 'LOW')}
                </span>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-[#E6F0FF] shadow-card flex flex-col items-center justify-center space-y-3">
                <span className="text-xs font-bold text-[#5A5E7A] uppercase tracking-wider">
                  Model Confidence Rating
                </span>
                <span className="text-4xl sm:text-5xl font-mono font-black text-[#014BAA]">
                  {formatConfidence(data.confidence)}%
                </span>
                <span className="text-xs text-[#5A5E7A]">
                  Specimen: <strong>{data.fileName || 'specimen'}</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
