import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';
import { clearUserScanHistory } from '../services/scanHistoryService';

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
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    organizationName?: string
  ) => Promise<{ requiresOtp: boolean; email: string; message: string; emailDelivered?: boolean }>;
  verifyOtp: (
    email: string,
    otp: string,
    purpose?: 'SIGNUP' | 'LOGIN' | 'FORGOT_PASSWORD'
  ) => Promise<{ success: boolean; message: string; user?: User }>;
  requestLoginOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  loginWithOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (
    email: string,
    purpose?: 'SIGNUP' | 'LOGIN' | 'FORGOT_PASSWORD'
  ) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, otp: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('deepshield_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('deepshield_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  // Synchronize Theme to localStorage & DOM documentElement
  useEffect(() => {
    localStorage.setItem('deepshield_theme', theme);
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
  }, [theme]);

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

  const setTheme = useCallback((newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

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
      if (err.response?.data?.requiresOtp) {
        const customErr: any = new Error(err.response.data.message || 'Please verify your email with the 6-digit OTP code.');
        customErr.requiresOtp = true;
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
        requiresOtp: true,
        email: res.data?.email || email,
        message: res.data?.message || 'Account created. Enter the 6-digit OTP sent to your email.',
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

  const verifyOtp = async (
    email: string,
    otp: string,
    purpose: 'SIGNUP' | 'LOGIN' | 'FORGOT_PASSWORD' = 'SIGNUP'
  ) => {
    try {
      const res = await apiClient.post('/auth/verify-otp', { email, otp, purpose });
      const { token: accessToken, refreshToken, user: loggedUser } = res.data;

      if (accessToken && loggedUser) {
        localStorage.setItem('deepshield_token', accessToken);
        if (refreshToken) {
          localStorage.setItem('deepshield_refresh_token', refreshToken);
        }
        setToken(accessToken);
        setUser(loggedUser);
      }

      return {
        success: true,
        message: res.data?.message || 'OTP verification successful.',
        user: loggedUser,
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'OTP verification failed or code expired.';
      throw new Error(errorMsg);
    }
  };

  const requestLoginOtp = async (email: string) => {
    try {
      const res = await apiClient.post('/auth/request-login-otp', { email });
      return {
        success: true,
        message: res.data?.message || 'If an account exists, a 6-digit OTP code has been sent.',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to request login OTP.';
      throw new Error(errorMsg);
    }
  };

  const loginWithOtp = async (email: string, otp: string) => {
    await verifyOtp(email, otp, 'LOGIN');
  };

  const resendOtp = async (
    email: string,
    purpose: 'SIGNUP' | 'LOGIN' | 'FORGOT_PASSWORD' = 'SIGNUP'
  ) => {
    try {
      const res = await apiClient.post('/auth/resend-otp', { email, purpose });
      return {
        success: true,
        message: res.data?.message || 'A new 6-digit OTP code has been sent to your email.',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to resend OTP code.';
      throw new Error(errorMsg);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      return {
        success: true,
        message: res.data?.message || 'If an account exists, a 6-digit OTP code has been sent.',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to process password reset request.';
      throw new Error(errorMsg);
    }
  };

  const resetPassword = async (email: string, otp: string, password: string) => {
    try {
      const res = await apiClient.post('/auth/reset-password', {
        email,
        otp,
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
      clearUserScanHistory(user?.id);
      localStorage.removeItem('deepshield_token');
      localStorage.removeItem('deepshield_refresh_token');
      setToken(null);
      setUser(null);
    }
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        theme,
        setTheme,
        toggleTheme,
        login,
        register,
        verifyOtp,
        requestLoginOtp,
        loginWithOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
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
