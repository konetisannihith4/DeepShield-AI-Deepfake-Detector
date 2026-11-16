import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Mail,
  Lock,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Check,
  X,
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { forgotPassword, resetPassword, resendOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'RESET' && resendCooldown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendCooldown]);

  const passwordRequirements = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', valid: /[a-z]/.test(password) },
  ];

  const isPasswordValid = passwordRequirements.every((r) => r.valid);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please provide your registered account email.');
      return;
    }

    setLoading(true);

    try {
      await forgotPassword(trimmedEmail);
      setStep('RESET');
      setResendCooldown(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setError('Please provide the 6-digit code delivered to your email.');
      return;
    }
    if (!isPasswordValid) {
      setError('New password does not fulfill security requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email.trim(), trimmedOtp, password);
      navigate('/login', {
        state: { message: 'Password has been reset successfully. Please sign in with your new credentials.' },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Check OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      setError(null);
      await resendOtp(email.trim(), 'FORGOT_PASSWORD');
      setResendFeedback('A new 6-digit password reset code has been sent.');
      setResendCooldown(60);
      setCanResend(false);
      setTimeout(() => setResendFeedback(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F3F0] text-[#282B4A] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-[#014BAA] selection:text-white">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E6F0FF] rounded-full blur-3xl opacity-60 pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FDF1F5] rounded-full blur-3xl opacity-60 pointer-events-none -z-0" />

      <div className="max-w-md w-full rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-card-hover relative z-10 space-y-6">
        <div className="text-center space-y-2">
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
          <h2 className="text-2xl font-black font-display text-[#014BAA] tracking-tight">Account Recovery</h2>
          <p className="text-xs text-[#5A5E7A]">
            {step === 'REQUEST' ? 'Receive a 6-digit OTP to reset your password' : 'Enter verification code and choose new password'}
          </p>
        </div>

        {resendFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{resendFeedback}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {step === 'REQUEST' ? (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#282B4A] block mb-1.5">
                Registered Work Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#5A5E7A]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="analyst@enterprise.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E6F0FF] text-xs text-[#282B4A] placeholder-[#888DAA] focus:border-[#014BAA]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#014BAA] hover:bg-[#013D8B] text-white font-extrabold text-xs shadow-royal transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-[#E6F0FF] border border-[#BFDAFE] text-xs text-[#014BAA] flex items-center justify-between">
              <span>Code sent to: <strong>{email}</strong></span>
              <button
                type="button"
                onClick={() => setStep('REQUEST')}
                className="underline text-[11px] font-bold"
              >
                Change
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-[#282B4A] block mb-1.5">
                Enter 6-Digit Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-[#5A5E7A]" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E6F0FF] text-center font-mono text-lg font-bold tracking-widest text-[#014BAA] focus:border-[#014BAA]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#282B4A] block mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#5A5E7A]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-[#E6F0FF] text-xs text-[#282B4A] placeholder-[#888DAA] focus:border-[#014BAA]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#5A5E7A] hover:text-[#014BAA]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#282B4A] block mb-1.5">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#5A5E7A]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-[#E6F0FF] text-xs text-[#282B4A] placeholder-[#888DAA] focus:border-[#014BAA]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-[#5A5E7A] hover:text-[#014BAA]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5A5E7A]">
                {canResend ? 'Didn’t receive code?' : `Resend in ${resendCooldown}s`}
              </span>
              <button
                type="button"
                disabled={!canResend}
                onClick={handleResend}
                className="font-bold text-[#014BAA] hover:underline disabled:opacity-40"
              >
                Resend Code
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#014BAA] hover:bg-[#013D8B] text-white font-extrabold text-xs shadow-royal transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-[#E6F0FF] text-xs">
          <Link to="/login" className="font-bold text-[#014BAA] hover:underline inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Console Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
