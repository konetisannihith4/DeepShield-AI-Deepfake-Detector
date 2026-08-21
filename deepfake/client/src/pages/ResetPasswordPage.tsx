import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, ArrowRight, Eye, EyeOff, Check, X, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerifyingToken, setIsVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { verifyResetToken, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Validate reset token on mount
  useEffect(() => {
    let isMounted = true;

    const checkToken = async () => {
      if (!token) {
        if (isMounted) {
          setTokenValid(false);
          setError('Missing password reset security token in URL.');
          setIsVerifyingToken(false);
        }
        return;
      }

      try {
        const res = await verifyResetToken(token);
        if (isMounted) {
          setTokenValid(res.valid);
          if (res.valid) {
            setUserEmail(res.email || null);
          } else {
            setError(res.message || 'The password reset token is invalid or has expired.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setTokenValid(false);
          setError(err.message || 'Failed to verify password reset token.');
        }
      } finally {
        if (isMounted) {
          setIsVerifyingToken(false);
        }
      }
    };

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Password Requirement Checks
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'At least one number (0-9)', met: /[0-9]/.test(password) },
    { label: 'At least one special character (!@#$%^&*)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const allRequirementsMet = requirements.every((r) => r.met);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing password reset security token.');
      return;
    }

    if (!allRequirementsMet) {
      setError('Please ensure your new password satisfies all security criteria below.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirmation password do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword(token, password);
      navigate('/login', {
        state: {
          message: res.message || 'Password has been reset successfully. Please sign in with your new credentials.',
        },
        replace: true,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
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
          <h2 className="text-2xl font-extrabold font-display text-white tracking-tight">Set New Password</h2>
          <p className="text-xs text-slate-400">
            {userEmail ? (
              <span>
                Resetting security credentials for <strong className="text-slate-200">{userEmail}</strong>
              </span>
            ) : (
              'Enter and confirm your new secure master password'
            )}
          </p>
        </div>

        {isVerifyingToken ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-[#00e6a8] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Validating password reset security token...</span>
          </div>
        ) : !tokenValid ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>Invalid or Expired Token</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {error || 'This password reset link is invalid, has already been consumed, or has expired.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/forgot-password"
                className="w-full py-3 rounded-xl text-xs font-bold bg-[#00e6a8] hover:bg-[#36d399] text-[#070c1a] shadow-lg shadow-[#00e6a8]/20 transition-all flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Request New Reset Link
              </Link>
              <Link
                to="/login"
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 text-center transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                New Password <span className="text-red-400">*</span>
              </label>
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
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Confirm New Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border text-xs text-white placeholder-slate-500 focus:outline-none transition-colors ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : 'border-red-500/60 focus:border-red-500'
                      : 'border-slate-800 focus:border-[#00e6a8]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors p-0.5"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Criteria Checklist */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Security Criteria:
              </span>
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  {req.met ? (
                    <Check className="w-3.5 h-3.5 text-[#00e6a8] shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                  <span className={req.met ? 'text-slate-200' : 'text-slate-500'}>{req.label}</span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold bg-[#00e6a8] hover:bg-[#36d399] text-[#070c1a] shadow-lg shadow-[#00e6a8]/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#070c1a] border-t-transparent rounded-full animate-spin" />
                  <span>Updating Security Password...</span>
                </>
              ) : (
                <>
                  <span>Confirm New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
