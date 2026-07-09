import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, Mail, Lock, CheckCircle, AlertCircle, RefreshCw, KeyRound,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import api from '../api/axios';

type Step = 'LOGIN' | 'OTP' | 'FORGOT_EMAIL' | 'FORGOT_RESET';

const Login = () => {
  const [step, setStep] = useState<Step>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const saveSessionAndRedirect = (data: any) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', String(data.userId));
    localStorage.setItem('userName', data.name);
    navigate('/dashboard');
  };

  const clearMessages = () => { setError(''); setInfoMsg(''); };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.requiresOtp) {
        setStep('OTP');
        setInfoMsg(response.data.message || `Enter the 6-digit code sent to ${email}.`);
      } else if (response.data?.token) {
        saveSessionAndRedirect(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP verification (email activation) ────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (otpInput.length < 4) { setError('Please enter the 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: otpInput.trim(),
        purpose: 'EMAIL_VERIFICATION',
      });
      if (response.data?.token) {
        saveSessionAndRedirect(response.data);
      } else {
        setError(response.data?.message || 'OTP verification failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    clearMessages();
    setLoading(true);
    try {
      const res = await api.post('/auth/resend-otp', { email, purpose: 'EMAIL_VERIFICATION' });
      setInfoMsg(res.data?.message || 'A new OTP has been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not resend OTP. Wait 30 seconds and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ─────────────────────────────────────────────────────────
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setStep('FORGOT_RESET');
      setInfoMsg(res.data?.message || `A password-reset code has been sent to ${email}.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not find an account with that email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email,
        otp: otpInput.trim(),
        newPassword,
        confirmPassword: confirmNewPassword,
      });
      setStep('LOGIN');
      setInfoMsg(res.data?.message || 'Password reset! You can now sign in.');
      setPassword(''); setOtpInput(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. OTP may be incorrect or expired.');
    } finally {
      setLoading(false);
    }
  };

  // ── Real Google OAuth 2.0 ──────────────────────────────────────────────────
  // GoogleLogin widget opens Google's official account-selection popup.
  // Google returns a signed ID token (JWT) — we send only that to the backend.
  // The backend verifies the token with Google's public keys and creates/logs in the user.
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    clearMessages();
    setLoading(true);
    try {
      const response = await api.post('/auth/google', {
        idToken: credentialResponse.credential,
      });
      saveSessionAndRedirect(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed. Please try again.');
  };

  // ── Title / subtitle helpers ────────────────────────────────────────────────
  const titles: Record<Step, string> = {
    LOGIN: 'Sign In to Limitly',
    OTP: 'Verify Your Email',
    FORGOT_EMAIL: 'Reset Your Password',
    FORGOT_RESET: 'Set New Password',
  };
  const subtitles: Record<Step, string> = {
    LOGIN: 'Welcome back! Enter your credentials below.',
    OTP: `Enter the 6-digit code sent to ${email}`,
    FORGOT_EMAIL: "Enter your registered email and we'll send a recovery code.",
    FORGOT_RESET: `Enter the recovery code sent to ${email}`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-blue-600 text-white w-12 h-12 rounded-2xl shadow-md mb-3">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{titles[step]}</h2>
          <p className="text-xs text-gray-500 mt-1">{subtitles[step]}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {infoMsg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3.5 rounded-xl mb-4 text-xs font-semibold flex items-start gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* ── LOGIN ── */}
        {step === 'LOGIN' && (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Password</label>
                  <button
                    type="button"
                    onClick={() => { clearMessages(); setStep('FORGOT_EMAIL'); }}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition mt-2"
              >
                {loading ? 'Signing In…' : 'Sign In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-bold">Or continue with</span>
              </div>
            </div>

            {/* Real Google OAuth 2.0 Button */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                width="350"
                text="continue_with"
                shape="rectangular"
              />
            </div>
          </>
        )}

        {/* ── OTP VERIFICATION ── */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-gray-900"
                placeholder="000000"
                autoFocus
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition"
            >
              {loading ? 'Verifying…' : 'Verify & Activate Account'}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => { setStep('LOGIN'); clearMessages(); }}
                className="text-gray-500 hover:text-gray-700 font-semibold"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT PASSWORD — enter email ── */}
        {step === 'FORGOT_EMAIL' && (
          <form onSubmit={handleForgotRequest} className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 text-xs">
              Enter your registered email and we'll send a one-time recovery code.
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition"
            >
              {loading ? 'Sending…' : 'Send Recovery Code'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep('LOGIN'); clearMessages(); }}
                className="text-xs font-bold text-gray-500 hover:text-gray-700"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT PASSWORD — enter OTP + new password ── */}
        {step === 'FORGOT_RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 text-center">
                Recovery Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.4em] text-xl font-black py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-gray-900"
                placeholder="000000"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">New Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Confirm New Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Re-enter new password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition"
            >
              {loading ? 'Resetting…' : 'Reset Password & Sign In'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep('LOGIN'); clearMessages(); }}
                className="text-xs font-bold text-gray-500 hover:text-gray-700"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        <p className="text-center mt-6 text-xs text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 font-bold hover:underline">Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;