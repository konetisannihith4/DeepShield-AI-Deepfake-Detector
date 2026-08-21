import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mic, Upload, Lock, CheckCircle, ArrowRight, Play, Pause, Activity, Zap, FileText, Cpu, Database, RefreshCw, FileCode, Search, Award } from 'lucide-react';
import { WaveformCanvas } from '../components/ai/WaveformCanvas';
import { SpectrogramCanvas } from '../components/ai/SpectrogramCanvas';

export const LandingPage: React.FC = () => {
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  return (
    <div className="min-h-screen bg-[#070c1a] text-slate-100 flex flex-col font-sans selection:bg-[#00e6a8] selection:text-[#070c1a]">
      {/* Top Banner Navigation (Matching Screenshot 1 Header) */}
      <header className="h-20 border-b border-slate-800/80 px-8 flex items-center justify-between backdrop-blur-xl sticky top-0 z-50 bg-[#070c1a]/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00e6a8]/20 border border-[#00e6a8]/40 flex items-center justify-center text-[#00e6a8] font-bold shadow-lg shadow-[#00e6a8]/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="font-display font-extrabold text-xl tracking-tight text-[#00e6a8]">TRUEVISION</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block -mt-1">
              DeepShield Voice Detection
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-[#00e6a8] transition-colors">About</a>
          <a href="#features" className="hover:text-[#00e6a8] transition-colors">Key Features</a>
          <Link to="/upload" className="hover:text-[#00e6a8] transition-colors">Detect Audio</Link>
          <Link to="/reports" className="hover:text-[#00e6a8] transition-colors">Detection History</Link>
          <Link to="/reports" className="hover:text-[#00e6a8] transition-colors">SHA-256 Digital Reports</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors">
            Logout
          </Link>
          <Link to="/upload" className="px-5 py-2 rounded-lg text-xs font-extrabold bg-[#00e6a8] text-[#070c1a] hover:bg-[#36d399] transition-all flex items-center gap-2 glow-cyan">
            Start Detection
          </Link>
        </div>
      </header>

      {/* Hero Section (Matching Screenshot 1 Hero) */}
      <section className="px-8 py-24 max-w-6xl mx-auto text-center flex flex-col items-center relative">
        <h1 className="text-4xl md:text-6xl font-extrabold font-display tracking-tight text-[#00e6a8] leading-tight max-w-4xl">
          True Vision - DeepFake Voice Detection
        </h1>

        <p className="mt-6 text-base md:text-lg text-slate-300 max-w-3xl leading-relaxed">
          Protect yourself from digital deception with our state-of-the-art voice clone detection technology. Upload your audio and get instant analysis powered by advanced AI.
        </p>

        <div className="mt-10 flex justify-center">
          <Link
            to="/upload"
            className="px-10 py-4 rounded-xl text-sm font-extrabold bg-[#00e6a8] text-[#070c1a] hover:bg-[#36d399] transition-all flex items-center gap-3 glow-cyan text-center tracking-wider uppercase hover:scale-105"
          >
            START DETECTION
          </Link>
        </div>

        {/* Animated Audio Waveform Demo Box */}
        <div id="waveform-demo" className="mt-16 w-full max-w-4xl rounded-2xl bg-[#0d1527] border border-[#00e6a8]/30 p-6 glass-card shadow-2xl text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                className="w-10 h-10 rounded-full bg-[#00e6a8] hover:bg-[#36d399] text-[#070c1a] flex items-center justify-center font-bold shadow-lg transition-transform hover:scale-105"
              >
                {isPlayingDemo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div>
                <h4 className="text-sm font-bold text-white">Live Audio Specimen: CEO_Voice_Verification.wav</h4>
                <p className="text-xs text-slate-400">Duration: 12.8s • Format: WAV PCM 16kHz • SHA-256 Digital Hash Signed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[#00e6a8] font-bold text-xs">
                GENUINE VOICE (99.95%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WaveformCanvas
              waveform={Array.from({ length: 80 }, (_, i) => Math.sin(i * 0.3) * 0.9)}
              durationSeconds={12.8}
            />
            <SpectrogramCanvas
              spectrogram={Array.from({ length: 32 }, () => Array.from({ length: 16 }, () => Math.random()))}
            />
          </div>
        </div>
      </section>

      {/* KEY FEATURES SECTION (Matching Screenshot 1 Layout) */}
      <section id="features" className="py-20 px-8 bg-[#091022] border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold font-display text-[#00e6a8] uppercase tracking-wider">KEY FEATURES</h2>
            <p className="text-slate-400 mt-2 text-xs">Advanced deep learning voice authentication & forensic certificate generation suite.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 1. HIGH ACCURACY */}
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card glass-card-hover text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#00e6a8]/10 text-[#00e6a8] border border-[#00e6a8]/30 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">HIGH ACCURACY</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our advanced WavLM neural model achieves industry-leading 99.95% accuracy in detecting manipulated voices.
              </p>
            </div>

            {/* 2. REAL-TIME ANALYSIS */}
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card glass-card-hover text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#00e6a8]/10 text-[#00e6a8] border border-[#00e6a8]/30 flex items-center justify-center mx-auto">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">REAL-TIME ANALYSIS</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get instant results with our efficient processing system and detailed confidence scores and spectral breakdown.
              </p>
            </div>

            {/* 3. USER-FRIENDLY */}
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card glass-card-hover text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#00e6a8]/10 text-[#00e6a8] border border-[#00e6a8]/30 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">USER-FRIENDLY</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simple upload process and clear visualization of results make detection accessible and intuitive for everyone.
              </p>
            </div>

            {/* 4. SHA-256 DIGITAL REPORT */}
            <div className="p-6 rounded-2xl bg-[#0d1527] border border-[#00e6a8]/20 glass-card glass-card-hover text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#00e6a8]/10 text-[#00e6a8] border border-[#00e6a8]/30 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">SHA-256 DIGITAL REPORT</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatic generation of PDF certificates & JSON reports backed by SHA-256 cryptographic verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-8 px-8 text-center text-xs text-slate-400 bg-[#070c1a]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-bold text-white">TRUEVISION • DeepShield Enterprise AI Detection</span>
          <div className="flex gap-4 text-[11px]">
            <Link to="/upload" className="hover:text-[#00e6a8]">Detect Audio</Link>
            <Link to="/reports" className="hover:text-[#00e6a8]">Detection History</Link>
            <Link to="/reports" className="hover:text-[#00e6a8]">SHA-256 Reports</Link>
          </div>
          <p>© {new Date().getFullYear()} All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};
