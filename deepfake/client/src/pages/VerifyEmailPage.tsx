import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, Link } from 'react-router-dom';
import { Shield, CheckCircle2, AlertCircle, Mail, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Resend form state for expired/invalid tokens
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const { verifyEmail, resendVerification } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const performVerification = async () => {
      if (!token) {
        if (isMounted) {
          setIsVerifying(false);
          setIsSuccess(false);
          setError('No verification token provided in the verification URL.');
        }
        return;
      }

      try {
        const res = await verifyEmail(token);
        if (isMounted) {
          setIsSuccess(true);
          setMessage(res.message);
        }
      } catch (err: any) {
        if (isMounted) {
          setIsSuccess(false);
          setError(err.message || 'Email verification link is invalid or has expired.');
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    setIsResending(true);
    setResendMessage(null);

    try {
      const res = await resendVerification(resendEmail.trim());
      setResendMessage(res.message);
    } catch (err: any) {
      setResendMessage(err.message || 'Failed to resend verification link.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c1a] flex flex-col justify-center items-center p-6 text-slate-100 selection:bg-[#00e6a8] selection:text-[#070c1a] relative overflow-hidden">
      {/* Background Cyber Grid Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(#00e6a8_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00e6a8]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-8 backdrop-blur-xl space-y-6 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
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
          <h2 className="text-2xl font-extrabold font-display text-white tracking-tight">Account Activation</h2>
          <p className="text-xs text-slate-400">Cryptographic email verification gateway</p>
        </div>

        {isVerifying ? (
          <div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#00e6a8]/10 border border-[#00e6a8]/30 flex items-center justify-center text-[#00e6a8] animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="absolute -inset-1 bg-[#00e6a8]/20 rounded-2xl blur-md -z-10 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-sm text-slate-200">Verifying Security Token...</span>
              <p className="text-xs text-slate-400">Confirming cryptographic signature with MySQL database</p>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="space-y-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-display">Email Verified Successfully</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {message ||
                  'Your enterprise analyst credentials have been activated. You may now sign in to your security console.'}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="w-full py-3 rounded-xl text-xs font-bold bg-[#00e6a8] hover:bg-[#36d399] text-[#070c1a] shadow-lg shadow-[#00e6a8]/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <span>Sign In to Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>Verification Link Expired or Invalid</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {error || 'The cryptographic verification link has already been used or has expired (24-hour limit).'}
              </p>
            </div>

            {/* Resend Verification Link Sub-form */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-200 block">Request a New Verification Link</span>
              <form onSubmit={handleResend} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e6a8]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isResending}
                  className="w-full py-2.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending New Link...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Resend Verification Email</span>
                    </>
                  )}
                </button>
              </form>

              {resendMessage && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                  {resendMessage}
                </div>
              )}
            </div>

            <div className="text-center pt-1">
              <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200 transition-colors">
                Return to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
