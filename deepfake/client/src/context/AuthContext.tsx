import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
  organizationId: string;
  organizationName?: string;
  isEmailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    organizationName?: string
  ) => Promise<{ requiresVerification: boolean; email: string; message: string; emailDelivered?: boolean }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
  verifyResetToken: (token: string) => Promise<{ valid: boolean; email?: string; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('deepshield_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Verify session on startup or when token changes
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('deepshield_token');
      if (storedToken) {
        try {
          const res = await apiClient.get('/auth/me');
          if (isMounted && res.data?.user) {
            setUser(res.data.user);
            setToken(storedToken);
          }
        } catch (err) {
          console.warn('[Auth] Session validation failed:', err);
          if (isMounted) {
            localStorage.removeItem('deepshield_token');
            localStorage.removeItem('deepshield_refresh_token');
            setUser(null);
            setToken(null);
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  };

  const login = async (email: string, password: string, _rememberMe: boolean = true) => {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { token: accessToken, refreshToken, user: loggedUser } = res.data;

      localStorage.setItem('deepshield_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('deepshield_refresh_token', refreshToken);
      }

      setToken(accessToken);
      setUser(loggedUser);
    } catch (err: any) {
      if (err.response?.data?.isUnverified) {
        const customErr: any = new Error(err.response.data.message || 'Please verify your email address before signing in.');
        customErr.isUnverified = true;
        customErr.email = err.response.data.email || email;
        throw customErr;
      }

      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.response?.data?.details && Array.isArray(err.response.data.details)
          ? err.response.data.details.map((d: any) => d.message).join('; ')
          : null) ||
        'Authentication failed. Please verify your credentials.';
      throw new Error(errorMsg);
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    organizationName?: string
  ) => {
    try {
      const res = await apiClient.post('/auth/register', {
        email,
        password,
        fullName,
        organizationName: organizationName?.trim() || undefined,
      });

      return {
        requiresVerification: true,
        email: res.data?.email || email,
        message: res.data?.message || 'Account created successfully. Please verify your email.',
        emailDelivered: res.data?.emailDelivered,
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.response?.data?.details && Array.isArray(err.response.data.details)
          ? err.response.data.details.map((d: any) => d.message).join('; ')
          : null) ||
        'Account registration failed. Please check your inputs.';
      throw new Error(errorMsg);
    }
  };

  const verifyEmail = async (verificationToken: string) => {
    try {
      const res = await apiClient.get('/auth/verify-email', {
        params: { token: verificationToken },
      });
      return {
        success: true,
        message: res.data?.message || 'Email verified successfully.',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Email verification failed or token expired.';
      throw new Error(errorMsg);
    }
  };

  const resendVerification = async (email: string) => {
    try {
      const res = await apiClient.post('/auth/resend-verification', { email });
      return {
        success: true,
        message: res.data?.message || 'Verification email has been resent.',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to resend verification email.';
      throw new Error(errorMsg);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      return {
        success: true,
        message: res.data?.message || 'If an account exists for this email, password reset instructions have been sent.',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to process password reset request.';
      throw new Error(errorMsg);
    }
  };

  const verifyResetToken = async (resetToken: string) => {
    try {
      const res = await apiClient.get('/auth/verify-reset-token', {
        params: { token: resetToken },
      });
      return {
        valid: true,
        email: res.data?.email,
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid or expired reset token.';
      return {
        valid: false,
        message: msg,
      };
    }
  };

  const resetPassword = async (resetToken: string, password: string) => {
    try {
      const res = await apiClient.post('/auth/reset-password', {
        token: resetToken,
        password,
      });
      return {
        success: true,
        message: res.data?.message || 'Password has been reset successfully.',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.response?.data?.details && Array.isArray(err.response.data.details)
          ? err.response.data.details.map((d: any) => d.message).join('; ')
          : null) ||
        'Failed to reset password.';
      throw new Error(errorMsg);
    }
  };

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('deepshield_refresh_token');
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.warn('[Auth] Server logout notification failed:', err);
    } finally {
      localStorage.removeItem('deepshield_token');
      localStorage.removeItem('deepshield_refresh_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        theme,
        toggleTheme,
        login,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        verifyResetToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
