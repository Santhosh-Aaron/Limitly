import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, User as UserIcon, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import api from '../api/axios';

const Signup = () => {
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpInput, setOtpInput] = useState('');
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/signup', { name, email, password, confirmPassword });
      if (response.data?.requiresOtp) {
        setStep('OTP');
        setInfoMsg(response.data.message || `A 6-digit verification code has been sent to ${email}.`);
      } else if (response.data?.token) {
        saveSessionAndRedirect(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. That email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    if (otpInput.length < 4) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
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
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setInfoMsg('');
    setLoading(true);
    try {
      const response = await api.post('/auth/resend-otp', { email, purpose: 'EMAIL_VERIFICATION' });
      setInfoMsg(response.data?.message || 'A new OTP code has been sent to your email.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not resend OTP. Please wait 30 seconds and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Real Google OAuth 2.0 — receives the ID token from Google's official popup
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md">

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-blue-600 text-white w-12 h-12 rounded-2xl shadow-md mb-3">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {step === 'FORM' ? 'Create Your Account' : 'Verify Your Email'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {step === 'FORM'
              ? 'Join Limitly to track your expenses smarter.'
              : `We sent a 6-digit code to ${email}`}
          </p>
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

        {step === 'FORM' ? (
          <>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

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
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Re-enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-md disabled:opacity-50 transition"
              >
                {loading ? 'Creating Account…' : 'Sign Up & Send OTP'}
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

            {/* Real Google OAuth 2.0 Button — opens Google's official account-selection popup */}
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
        ) : (
          /* OTP Verification Step */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 text-center">
                Enter 6-Digit Verification Code
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
              {loading ? 'Verifying…' : 'Verify OTP & Activate Account'}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
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
                onClick={() => { setStep('FORM'); setOtpInput(''); setError(''); setInfoMsg(''); }}
                className="text-gray-500 hover:text-gray-700 font-semibold"
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        <p className="text-center mt-6 text-xs text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">Log in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;