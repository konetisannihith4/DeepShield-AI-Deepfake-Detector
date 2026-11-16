import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Mic,
  Upload,
  Lock,
  CheckCircle,
  ArrowRight,
  Play,
  Pause,
  Activity,
  Zap,
  FileText,
  Cpu,
  Database,
  RefreshCw,
  FileCode,
  Search,
  Award,
  Sparkles,
  Film,
  Image as ImageIcon,
  ScanFace,
  CheckCircle2,
  FileAudio,
} from 'lucide-react';
import { WaveformCanvas } from '../components/ai/WaveformCanvas';
import { SpectrogramCanvas } from '../components/ai/SpectrogramCanvas';

export const LandingPage: React.FC = () => {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F3F0] text-[#282B4A] flex flex-col font-sans selection:bg-[#014BAA] selection:text-white">
      {/* Top Banner Navigation */}
      <header className="h-20 bg-[#014BAA] text-white border-b border-[#013D8B] px-6 sm:px-10 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#014BAA] flex items-center justify-center font-bold shadow-sm">
            <Shield className="w-6 h-6 fill-[#014BAA]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-xl tracking-tight text-white leading-tight">
                TRUEVISION
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4B6CC]" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#E6F0FF]/90 font-bold block -mt-0.5">
              DeepShield AI Defense
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-[#E6F0FF]">
          <a href="#modules" className="hover:text-white transition-colors">Detection Modules</a>
          <Link to="/image-detection" className="hover:text-white transition-colors">Image Detection</Link>
          <Link to="/video-detection" className="hover:text-white transition-colors">Video Detection</Link>
          <Link to="/upload" className="hover:text-white transition-colors">Voice Detection</Link>
          <Link to="/history" className="hover:text-white transition-colors">Scan Archive</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/upload"
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-white text-[#014BAA] hover:bg-[#E6F0FF] transition-all flex items-center gap-2 shadow-sm"
          >
            Start Detection
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 sm:px-10 py-20 max-w-6xl mx-auto text-center flex flex-col items-center relative">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE] inline-flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#014BAA]" />
            Next-Gen Multi-Modal Deepfake Cybersecurity
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-[#014BAA] leading-tight max-w-4xl">
          TrueVision DeepShield AI Defense Platform
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#5A5E7A] max-w-3xl leading-relaxed">
          Comprehensive forensic verification for digital media. Protect your organization from manipulated images, synthetic videos, and AI voice clones with calibrated neural network classification.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/upload"
            className="px-9 py-4 rounded-xl text-xs sm:text-sm font-extrabold bg-[#014BAA] text-white hover:bg-[#013D8B] transition-all flex items-center gap-2.5 shadow-royal uppercase tracking-wider hover:scale-105"
          >
            <span>START DETECTION NOW</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/history"
            className="px-8 py-4 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#014BAA] border-1.5 border-[#014BAA] hover:bg-[#E6F0FF] transition-all shadow-sm"
          >
            VIEW SCAN ARCHIVE
          </Link>
        </div>

        {/* Interactive Specimen Box */}
        <div className="mt-16 w-full max-w-4xl rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-card-hover text-left relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E6F0FF] gap-4 mb-6">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                className="w-12 h-12 rounded-2xl bg-[#014BAA] hover:bg-[#013D8B] text-white flex items-center justify-center font-bold shadow-royal transition-all hover:scale-105"
                title="Play Audio Specimen"
              >
                {isPlayingDemo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div>
                <h4 className="text-sm font-extrabold text-[#282B4A]">Live Specimen Verification: executive_telemetry.wav</h4>
                <p className="text-xs text-[#5A5E7A]">Duration: 12.8s • 16kHz Mono • Cryptographic SHA-256 Digital Fingerprint Signed</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold text-xs inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                AUTHENTIC HUMAN SPEECH (99.95%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-2xl bg-[#F8F3F0] border border-[#E5D8D0]">
              <WaveformCanvas
                waveform={Array.from({ length: 80 }, (_, i) => Math.sin(i * 0.3) * 0.9)}
                durationSeconds={12.8}
              />
            </div>
            <div className="p-3 rounded-2xl bg-[#F8F3F0] border border-[#E5D8D0]">
              <SpectrogramCanvas
                spectrogram={Array.from({ length: 32 }, () => Array.from({ length: 16 }, () => Math.random()))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3 DETECTION MODULES SECTION */}
      <section id="modules" className="py-20 px-6 sm:px-10 bg-white border-t border-[#E6F0FF]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F0FF] text-[#014BAA] border border-[#BFDAFE]">
              Multi-Modal Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-[#014BAA]">
              Three Specialized Deepfake Defense Engines
            </h2>
            <p className="text-sm text-[#5A5E7A]">
              Independent neural architectures tailored to each digital media modality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 1. Image */}
            <div className="rounded-3xl bg-[#F8F3F0] border border-[#E6F0FF] p-8 shadow-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#014BAA] text-white flex items-center justify-center shadow-royal">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#282B4A]">Image Deepfake Detection</h3>
                <p className="text-xs sm:text-sm text-[#5A5E7A] leading-relaxed">
                  Evaluates facial portraits and photos for GAN generation artifacts, diffusion noise signatures, and face swaps using the ConvNeXtV2 architecture.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-[#014BAA]">
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E6F0FF]">JPEG</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E6F0FF]">PNG</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E6F0FF]">WEBP</span>
                </div>
              </div>
              <Link
                to="/image-detection"
                className="w-full py-3 rounded-xl bg-[#014BAA] text-white hover:bg-[#013D8B] font-bold text-xs flex items-center justify-center gap-2 shadow-royal transition-all"
              >
                <span>Analyze Images</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 2. Video */}
            <div className="rounded-3xl bg-[#F8F3F0] border border-[#E6F0FF] p-8 shadow-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#014BAA] text-white flex items-center justify-center shadow-royal">
                  <Film className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#282B4A]">Video Deepfake Detection</h3>
                <p className="text-xs sm:text-sm text-[#5A5E7A] leading-relaxed">
                  Extracts temporal frame sequences via OpenCV, isolates facial tracks with RetinaFace, and runs XceptionNet vision classification.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-[#014BAA]">
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E6F0FF]">MP4</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E6F0FF]">MOV</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E6F0FF]">WEBM</span>
                </div>
              </div>
              <Link
                to="/video-detection"
                className="w-full py-3 rounded-xl bg-[#014BAA] text-white hover:bg-[#013D8B] font-bold text-xs flex items-center justify-center gap-2 shadow-royal transition-all"
              >
                <span>Analyze Videos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3. Voice */}
            <div className="rounded-3xl bg-[#F8F3F0] border border-[#E6F0FF] p-8 shadow-card flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#014BAA] text-white flex items-center justify-center shadow-royal">
                  <FileAudio className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-[#282B4A]">Voice Deepfake Detection</h3>
                <p className="text-xs sm:text-sm text-[#5A5E7A] leading-relaxed">
                  Analyzes acoustic waveforms with 64-band FFT, MFCC extraction, and WavLM-base Transformer weights with temperature-scaled probabilities.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-[#014BAA]">
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E6F0FF]">WAV</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E6F0FF]">MP3</span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E6F0FF]">FLAC</span>
                </div>
              </div>
              <Link
                to="/upload"
                className="w-full py-3 rounded-xl bg-[#014BAA] text-white hover:bg-[#013D8B] font-bold text-xs flex items-center justify-center gap-2 shadow-royal transition-all"
              >
                <span>Analyze Voice Audio</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E6F0FF] py-8 px-6 text-center text-xs text-[#5A5E7A]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#014BAA]" />
            <span className="font-extrabold text-[#014BAA]">TrueVision DeepShield Enterprise AI</span>
          </div>
          <p>© 2026 TrueVision DeepShield. All rights reserved. Royal Blue + Light Cream Cybersecurity Edition.</p>
        </div>
      </footer>
    </div>
  );
};
