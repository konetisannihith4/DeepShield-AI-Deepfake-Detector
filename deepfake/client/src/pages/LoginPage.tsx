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

  const { login, requestLoginOtp, loginWithOtp, resendOtp, isAuthenticated, theme } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLight = theme === 'light';

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
        // Unverified email requiring OTP verification
        setLoginMode('OTP');
        setOtpStep('VERIFY');
        setResendCooldown(60);
        setError('Please enter the 6-digit OTP code sent to your email to complete login.');
      } else {
        setError(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Request OTP for Login
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await requestLoginOtp(trimmedEmail);
      setSuccessMsg(res.message);
      setOtpStep('VERIFY');
      setResendCooldown(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP for Login
  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setLoading(true);

    try {
      await loginWithOtp(trimmedEmail, otp.trim());
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    setError(null);
    setResendFeedback(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address to resend OTP.');
      return;
    }

    try {
      const res = await resendOtp(trimmedEmail, 'LOGIN');
      setResendFeedback(res.message || 'A new 6-digit OTP has been sent to your email.');
      setResendCooldown(60);
      setCanResend(false);
      setTimeout(() => setResendFeedback(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please wait 60 seconds.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#050816] text-white'
    } relative overflow-hidden font-sans`}>
      {/* Background Cyber Grid Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(#5b63f6_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.05] pointer-events-none" />

      <div className={`max-w-md w-full rounded-2xl border p-8 backdrop-blur-xl space-y-6 shadow-2xl relative z-10 transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-slate-200/60' : 'bg-[#0f172a] border-[#1e2a44]'
      }`}>
        {/* Branding & Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group mb-1">
            <div className="w-11 h-11 rounded-xl bg-[#5b63f6]/20 border border-[#5b63f6]/40 flex items-center justify-center text-[#5b63f6] group-hover:scale-105 group-hover:bg-[#5b63f6] group-hover:text-white transition-all shadow-lg shadow-[#5b63f6]/20">
              <Shield className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="font-display font-extrabold text-xl tracking-tight text-[#00e6a8]">TRUEVISION</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold block -mt-1">
                DEEPSHIELD ENTERPRISE
              </span>
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold font-display text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400">Sign in to your DeepShield security console</p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setLoginMode('PASSWORD');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              loginMode === 'PASSWORD'
                ? 'bg-[#00e6a8] text-[#070c1a] shadow-md shadow-[#00e6a8]/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('OTP');
              setOtpStep('REQUEST');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              loginMode === 'OTP'
                ? 'bg-[#00e6a8] text-[#070c1a] shadow-md shadow-[#00e6a8]/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Login with OTP
          </button>
        </div>

        {/* Banners */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {resendFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{resendFeedback}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Form rendering according to mode */}
        {loginMode === 'PASSWORD' ? (
          /* ================= MODE A: PASSWORD LOGIN ================= */
          <form onSubmit={handlePasswordLogin} noValidate className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Email Address <span className="text-red-400">*</span>
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
                  placeholder="yourname@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e6a8] focus:ring-1 focus:ring-[#00e6a8]/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password <span className="text-red-400">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-[#00e6a8] hover:text-[#36d399] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e6a8] focus:ring-1 focus:ring-[#00e6a8]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00e6a8] hover:bg-[#36d399] text-[#070c1a] font-bold text-sm shadow-lg shadow-[#00e6a8]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ================= MODE B: OTP LOGIN ================= */
          <div className="space-y-4">
            {otpStep === 'REQUEST' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Email Address <span className="text-red-400">*</span>
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
                      placeholder="yourname@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e6a8] focus:ring-1 focus:ring-[#00e6a8]/50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#00e6a8] hover:bg-[#36d399] text-[#070c1a] font-bold text-sm shadow-lg shadow-[#00e6a8]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit OTP Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpLogin} className="space-y-4">
                <div className="text-center">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Enter 6-Digit OTP Code Sent to <span className="text-[#00e6a8] font-mono">{email}</span>
                  </label>
                  <div className="relative max-w-[240px] mx-auto">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/[^0-9]/g, ''));
                        if (error) setError(null);
                      }}
                      placeholder="0 0 0 0 0 0"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-700 text-center font-mono text-lg tracking-[0.5em] font-bold text-[#00e6a8] placeholder-slate-600 focus:outline-none focus:border-[#00e6a8] focus:ring-1 focus:ring-[#00e6a8]/50 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 rounded-xl bg-[#00e6a8] hover:bg-[#36d399] text-[#070c1a] font-bold text-sm shadow-lg shadow-[#00e6a8]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Login with OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || loading}
                    className="text-xs font-medium text-slate-400 hover:text-[#00e6a8] disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                  >
                    {canResend ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resend OTP Code</span>
                      </>
                    ) : (
                      <span>Resend available in {resendCooldown} seconds</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#00e6a8] hover:text-[#36d399] font-semibold transition-colors">
              Create Enterprise Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
