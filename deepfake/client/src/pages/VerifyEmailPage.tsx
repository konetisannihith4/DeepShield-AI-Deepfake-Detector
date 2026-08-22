import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, KeyRound } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070c1a] flex flex-col justify-center items-center p-6 text-slate-100 selection:bg-[#00e6a8] selection:text-[#070c1a] relative overflow-hidden">
      <div className="max-w-md w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-8 backdrop-blur-xl space-y-6 shadow-2xl relative z-10 text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-1">
          <div className="w-11 h-11 rounded-xl bg-[#00e6a8]/20 border border-[#00e6a8]/40 flex items-center justify-center text-[#00e6a8] group-hover:scale-105 group-hover:bg-[#00e6a8] group-hover:text-[#070c1a] transition-all shadow-lg shadow-[#00e6a8]/20">
            <Shield className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="font-display font-extrabold text-xl tracking-tight text-[#00e6a8]">TRUEVISION</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block -mt-1">
              DEEPSHIELD ENTERPRISE
            </span>
          </div>
        </Link>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <KeyRound className="w-8 h-8 text-[#00e6a8] mx-auto" />
          <h2 className="text-xl font-bold text-white">6-Digit OTP Verification</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            DeepShield uses 6-digit OTP verification codes sent directly to your email address. Verification links are no longer required.
          </p>
        </div>

        <Link
          to="/login"
          className="w-full py-3 rounded-xl bg-[#00e6a8] hover:bg-[#36d399] text-[#070c1a] font-bold text-sm shadow-lg shadow-[#00e6a8]/20 transition-all flex items-center justify-center gap-2"
        >
          <span>Go to Console Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
