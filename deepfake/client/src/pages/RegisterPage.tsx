import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  User,
  Building2,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  KeyRound,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // OTP Verification View State
  const [step, setStep] = useState<'REGISTER' | 'VERIFY_OTP'>('REGISTER');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const { register, verifyOtp, resendOtp, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Resend OTP countdown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'VERIFY_OTP' && resendCooldown > 0) {
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName) {
      setError('Please provide your full name.');
      return;
    }
    if (!trimmedEmail) {
      setError('Please provide your work email address.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not meet the security complexity requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await register(trimmedEmail, password, trimmedFullName, organizationName.trim() || undefined);
      if (res.requiresOtp) {
        setStep('VERIFY_OTP');
        setResendCooldown(60);
        setCanResend(false);
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Check details and retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);

    try {
      await verifyOtp(email.trim(), trimmedOtp, 'SIGNUP');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setOtpError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setOtpError(null);
    setResendFeedback(null);

    try {
      const res = await resendOtp(email.trim(), 'SIGNUP');
      setResendFeedback(res.message || 'A new 6-digit code has been delivered.');
      setResendCooldown(60);
      setCanResend(false);
      setTimeout(() => setResendFeedback(null), 4000);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
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
          <h2 className="text-2xl font-black font-display text-[#014BAA] tracking-tight">Create Analyst Account</h2>
          <p className="text-xs text-[#5A5E7A]">Access enterprise multi-modal deepfake forensics</p>
        </div>

        {step === 'VERIFY_OTP' ? (
          /* Step 2: OTP */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#E6F0FF] border border-[#BFDAFE] text-center space-y-1 text-xs">
              <KeyRound className="w-6 h-6 text-[#014BAA] mx-auto mb-1" />
              <div className="font-bold text-[#014BAA]">Enter 6-Digit Email Verification Code</div>
              <p className="text-[#5A5E7A] text-[11px]">
                We sent a secure verification code to <strong>{email}</strong>
              </p>
            </div>

            {resendFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{resendFeedback}</span>
              </div>
            )}

            {otpError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  if (otpError) setOtpError(null);
                }}
                placeholder="123456"
                className="w-full pl-4 pr-4 py-3 rounded-xl bg-white border border-[#E6F0FF] text-center font-mono text-xl font-bold tracking-widest text-[#014BAA] focus:border-[#014BAA]"
              />

              <button
                type="submit"
                disabled={otpLoading || otp.length !== 6}
                className="w-full py-3.5 rounded-xl bg-[#014BAA] hover:bg-[#013D8B] text-white font-extrabold text-xs shadow-royal transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider"
              >
                {otpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-[#E6F0FF] space-y-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend || isResending}
                className="text-xs font-bold text-[#014BAA] hover:underline disabled:opacity-40"
              >
                {canResend ? 'Resend Verification Code' : `Resend code in ${resendCooldown}s`}
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => setStep('REGISTER')}
                  className="text-[11px] text-[#5A5E7A] hover:underline"
                >
                  Change email address
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Step 1: Form */
          <>
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#282B4A] block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#5A5E7A]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Alex Vance"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E6F0FF] text-xs text-[#282B4A] placeholder-[#888DAA] focus:border-[#014BAA]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282B4A] block mb-1">
                  Work Email <span className="text-red-500">*</span>
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
                    placeholder="alex@enterprise.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E6F0FF] text-xs text-[#282B4A] placeholder-[#888DAA] focus:border-[#014BAA]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282B4A] block mb-1">
                  Organization Name <span className="text-[#888DAA] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-[#5A5E7A]" />
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Enterprise Cybersecurity Corp"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E6F0FF] text-xs text-[#282B4A] placeholder-[#888DAA] focus:border-[#014BAA]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#282B4A] block mb-1">
                  Password <span className="text-red-500">*</span>
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
                <label className="text-xs font-bold text-[#282B4A] block mb-1">
                  Confirm Password <span className="text-red-500">*</span>
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

              {/* Password complexity helper */}
              {password && (
                <div className="p-3 rounded-xl bg-[#F8F3F0] border border-[#E5D8D0] grid grid-cols-2 gap-1.5 text-[10px]">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className={`flex items-center gap-1.5 ${req.valid ? 'text-emerald-700' : 'text-[#888DAA]'}`}>
                      {req.valid ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3" />}
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#014BAA] hover:bg-[#013D8B] text-white font-extrabold text-xs shadow-royal transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Verify</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="text-center pt-2 border-t border-[#E6F0FF] text-xs text-[#5A5E7A]">
          <span>Already have an account? </span>
          <Link to="/login" className="font-bold text-[#014BAA] hover:underline">
            Sign In to Console
          </Link>
        </div>
      </div>
    </div>
  );
};
