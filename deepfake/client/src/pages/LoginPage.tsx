import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  KeyRound,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [loginMode, setLoginMode] = useState<'PASSWORD' | 'OTP'>('PASSWORD');

  // Password Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP Login state
  const [otpStep, setOtpStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, requestLoginOtp, loginWithOtp, resendOtp, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  useEffect(() => {
    if ((location.state as any)?.message) {
      setSuccessMsg((location.state as any).message);
    }
  }, [location.state]);

  // Resend timer for OTP Login
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (loginMode === 'OTP' && otpStep === 'VERIFY' && resendCooldown > 0) {
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
  }, [loginMode, otpStep, resendCooldown]);

  // Handle Standard Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);

    try {
      await login(trimmedEmail, password);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      if (err.requiresOtp) {
        setLoginMode('OTP');
        setOtpStep('VERIFY');
        setSuccessMsg(err.message || 'Please verify your identity with the OTP sent to your email.');
      } else {
        setError(err.message || 'Invalid email address or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Request OTP Login
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address to receive an OTP.');
      return;
    }

    setLoading(true);

    try {
      const res = await requestLoginOtp(trimmedEmail);
      setSuccessMsg(res.message || 'A 6-digit OTP code has been delivered to your email.');
      setOtpStep('VERIFY');
      setResendCooldown(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send login OTP. If email OTP is not configured on your server, switch to "Password Sign In" above.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setError('Please enter the valid 6-digit OTP code sent to your email.');
      return;
    }

    setLoading(true);

    try {
      await loginWithOtp(email.trim(), trimmedOtp);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResend = async () => {
    if (!canResend) return;
    try {
      setError(null);
      const res = await resendOtp(email.trim(), 'LOGIN');
      setResendFeedback(res.message || 'A new 6-digit OTP has been sent to your email.');
      setResendCooldown(60);
      setCanResend(false);
      setTimeout(() => setResendFeedback(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please wait 60 seconds.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F3F0] text-[#282B4A] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-[#014BAA] selection:text-white">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E6F0FF] rounded-full blur-3xl opacity-60 pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FDF1F5] rounded-full blur-3xl opacity-60 pointer-events-none -z-0" />

      <div className="max-w-md w-full rounded-3xl bg-white border border-[#E6F0FF] p-6 sm:p-8 shadow-card-hover relative z-10 space-y-6">
        {/* Branding & Header */}
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
          <h2 className="text-2xl font-black font-display text-[#014BAA] tracking-tight">Console Authentication</h2>
          <p className="text-xs text-[#5A5E7A]">Sign in to access your AI deepfake detection console</p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#E6F0FF] rounded-2xl border border-[#BFDAFE]">
          <button
            type="button"
            onClick={() => {
              setLoginMode('PASSWORD');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              loginMode === 'PASSWORD'
                ? 'bg-[#014BAA] text-white shadow-royal'
                : 'text-[#014BAA] hover:bg-white/50'
            }`}
          >
            Password Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('OTP');
              setOtpStep('REQUEST');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              loginMode === 'OTP'
                ? 'bg-[#014BAA] text-white shadow-royal'
                : 'text-[#014BAA] hover:bg-white/50'
            }`}
          >
            OTP Code Sign In
          </button>
        </div>

        {/* Alerts & Feedback */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

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

        {/* Mode A: Password Login */}
        {loginMode === 'PASSWORD' ? (
          <form onSubmit={handlePasswordLogin} noValidate className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#282B4A] block mb-1.5">
                Work Email Address <span className="text-red-500">*</span>
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#282B4A]">
                  Account Password <span className="text-red-500">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-bold text-[#014BAA] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#5A5E7A]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#014BAA] hover:bg-[#013D8B] text-white font-extrabold text-xs shadow-royal transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Mode B: OTP Login */
          <div className="space-y-4">
            {otpStep === 'REQUEST' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#282B4A] block mb-1.5">
                    Registered Email Address <span className="text-red-500">*</span>
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
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-[#5A5E7A] text-center pt-1">
                  Prefer password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('PASSWORD');
                      setError(null);
                    }}
                    className="font-bold text-[#014BAA] underline hover:text-[#013D8B]"
                  >
                    Switch to Password Sign In
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-[#E6F0FF] border border-[#BFDAFE] text-xs text-[#014BAA] flex items-center justify-between">
                  <span>Code sent to: <strong>{email}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpStep('REQUEST')}
                    className="underline text-[11px] font-bold"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#282B4A] block mb-1.5">
                    Enter 6-Digit OTP Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-[#5A5E7A]" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, ''));
                        if (error) setError(null);
                      }}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E6F0FF] text-center font-mono text-lg font-bold tracking-widest text-[#014BAA] focus:border-[#014BAA]"
                    />
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
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Access Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-[#E6F0FF] text-xs text-[#5A5E7A]">
          <span>New to DeepShield? </span>
          <Link to="/register" className="font-bold text-[#014BAA] hover:underline">
            Register for Access
          </Link>
        </div>
      </div>
    </div>
  );
};
