import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, KeyRound } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F3F0] text-[#282B4A] flex flex-col justify-center items-center p-6 selection:bg-[#014BAA] selection:text-white relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E6F0FF] rounded-full blur-3xl opacity-60 pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FDF1F5] rounded-full blur-3xl opacity-60 pointer-events-none -z-0" />

      <div className="max-w-md w-full rounded-3xl bg-white border border-[#E6F0FF] p-8 shadow-card-hover relative z-10 space-y-6 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-2">
          <div className="w-11 h-11 rounded-2xl bg-[#014BAA] text-white flex items-center justify-center shadow-royal group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6 fill-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-xl tracking-tight text-[#014BAA]">
                TRUEVISION
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#F4B6CC]" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#5A5E7A] font-bold block -mt-0.5">
              DEEPSHIELD ENTERPRISE
            </span>
          </div>
        </Link>

        <div className="p-6 rounded-2xl bg-[#E6F0FF] border border-[#BFDAFE] space-y-3">
          <KeyRound className="w-8 h-8 text-[#014BAA] mx-auto" />
          <h2 className="text-xl font-extrabold text-[#014BAA]">OTP Password Reset</h2>
          <p className="text-xs text-[#5A5E7A] leading-relaxed">
            DeepShield uses secure 6-digit OTP verification codes for password resets. Please request a reset code on the Forgot Password page.
          </p>
        </div>

        <Link
          to="/forgot-password"
          className="w-full py-3.5 rounded-xl bg-[#014BAA] hover:bg-[#013D8B] text-white font-extrabold text-xs shadow-royal transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
        >
          <span>Go to Forgot Password</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
