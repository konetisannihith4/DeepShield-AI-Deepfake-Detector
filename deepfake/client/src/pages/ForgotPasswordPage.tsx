import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Shield, Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your registered work email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await forgotPassword(trimmedEmail);
      setSubmitted(true);
      setFeedbackMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to submit reset request.');
    } finally {
      setLoading(false);
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
          <h2 className="text-2xl font-extrabold font-display text-white tracking-tight">Forgot Password?</h2>
          <p className="text-xs text-slate-400">
            Enter your registered work email to receive password reset instructions
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Reset Instructions Dispatched</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {feedbackMessage ||
                  'If an account exists for this email, password reset instructions have been sent.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Infrastructure Notice</span>
              </div>
              <p className="leading-relaxed">
                Automated SMTP mail dispatch is not configured on this host. For audit and development verification,
                password reset tokens are recorded securely in the server console and audit log.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full py-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Registered Work Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="analyst@deepshield.ai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e6a8] focus:ring-1 focus:ring-[#00e6a8]/50 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold bg-[#00e6a8] hover:bg-[#36d399] text-[#070c1a] shadow-lg shadow-[#00e6a8]/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#070c1a] border-t-transparent rounded-full animate-spin" />
                  <span>Processing Request...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
