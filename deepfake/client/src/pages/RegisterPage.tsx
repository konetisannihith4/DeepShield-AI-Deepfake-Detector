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
  Info,
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

  // Post-registration Check Email Screen State
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [emailDelivered, setEmailDelivered] = useState<boolean | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  const { register, resendVerification, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Mask Email Utility (e.g. sunny@gmail.com -> s****@gmail.com)
  const maskEmail = (rawEmail: string) => {
    const parts = rawEmail.split('@');
    if (parts.length !== 2) return rawEmail;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 4))}${name[name.length - 1]}@${domain}`;
  };

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

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName || trimmedFullName.length < 2) {
      setError('Please provide your full legal or professional name (minimum 2 characters).');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!allRequirementsMet) {
      setError('Please ensure your password satisfies all security criteria below.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirmation password do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await register(
        trimmedEmail,
        password,
        trimmedFullName,
        organizationName.trim() || undefined
      );
      setRegisteredEmail(res.email);
      setEmailDelivered(res.emailDelivered ?? null);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please review your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setIsResending(true);
    setResendFeedback(null);

    try {
      const res = await resendVerification(registeredEmail);
      setResendFeedback(res.message);
    } catch (err: any) {
      setResendFeedback(err.message || 'Failed to resend verification email.');
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

          {registeredEmail ? (
            <>
              <h2 className="text-2xl font-extrabold font-display text-white tracking-tight">Check Your Email</h2>
              <p className="text-xs text-slate-400">Account created successfully</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold font-display text-white tracking-tight">Create Your Account</h2>
              <p className="text-xs text-slate-400">Register with your own email address and master password</p>
            </>
          )}
        </div>

        {/* Check Email Screen after Registration */}
        {registeredEmail ? (
          <div className="space-y-5">
            {emailDelivered === true ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Verification Email Sent!</span>
                </div>
                <p className="leading-relaxed text-slate-300">
                  A verification link has been sent to:{' '}
                  <strong className="text-white font-mono">{maskEmail(registeredEmail)}</strong>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Please open the email and click <strong>Verify Email</strong> to activate your account.
                  Also check your <strong>Spam / Junk</strong> folder if you don't see it within a minute.
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-slate-200 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                  <Info className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Account Created — Email Delivery Pending</span>
                </div>
                <p className="leading-relaxed text-slate-300">
                  Your account for <strong className="text-white font-mono">{maskEmail(registeredEmail)}</strong> was
                  created successfully, but the verification email could not be sent automatically.
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The email server is not yet configured. Please contact your DeepShield administrator to
                  configure SMTP credentials, or use the <strong>Resend</strong> button below once it is configured.
                </p>
              </div>
            )}

            {/* Resend Verification Action */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">Didn't receive the email?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching New Link...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-[#00e6a8]" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </button>

              {resendFeedback && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-[#00e6a8]">
                  {resendFeedback}
                </div>
              )}
            </div>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="w-full py-3 rounded-xl text-xs font-bold bg-[#00e6a8] hover:bg-[#36d399] text-[#070c1a] shadow-lg shadow-[#00e6a8]/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <>
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e6a8] focus:ring-1 focus:ring-[#00e6a8]/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Organization Name <span className="text-slate-500 text-[11px] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Cybersecurity Operations LLC"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e6a8] focus:ring-1 focus:ring-[#00e6a8]/50 transition-colors"
                  />
                </div>
              </div>

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
                    placeholder="yourname@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00e6a8] focus:ring-1 focus:ring-[#00e6a8]/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Create Master Password <span className="text-red-400">*</span>
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
                  Confirm Password <span className="text-red-400">*</span>
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

              {/* Password Requirements Checklist */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Password Strength Criteria:
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
                    <span>Creating Account & Dispatching Email...</span>
                  </>
                ) : (
                  <>
                    <span>Register & Verify Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400 pt-1">
              Already registered?{' '}
              <Link to="/login" className="text-[#00e6a8] hover:text-[#36d399] font-semibold">
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
