'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, resendVerificationEmail, requestLoginOtp, verifyLoginOtp } from '@/lib/api/auth';

type ApiError = Error & {
  code?: string;
  details?: { retryAfterSeconds?: number };
};

function formatRetryAfterMessage(baseMessage: string, apiErr: ApiError): string {
  const retryAfterSeconds = apiErr.details?.retryAfterSeconds;
  if (typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0) {
    return `${baseMessage} Try again in ${retryAfterSeconds} seconds.`;
  }
  return baseMessage;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEmailNotVerified, setIsEmailNotVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [resendError, setResendError] = useState(false);

  // OTP login state
  const [authMode, setAuthMode] = useState<'password' | 'email-code'>('password');
  const [otpStep, setOtpStep] = useState<'email' | 'code-sent'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendOtpStatus, setResendOtpStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus OTP input when entering code-sent step
  useEffect(() => {
    if (authMode === 'email-code' && otpStep === 'code-sent') {
      otpInputRef.current?.focus();
    }
  }, [authMode, otpStep]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsEmailNotVerified(false);
    setIsSubmitting(true);

    try {
      await login(email, password);
      const next = searchParams.get('next');
      const destination =
        next && next.startsWith('/') && !/^\/[/\\]/.test(next) ? next : '/tasks';
      router.replace(destination);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'email_not_verified') {
        setIsEmailNotVerified(true);
        setVerifiedEmail(email);
        setResendStatus('idle');
        setResendError(false);
        setError('Please verify your email.');
      } else if (apiErr.code === 'invalid_credentials') {
        setError('Invalid email or password.');
      } else if (apiErr.code === 'passwordless_account_use_otp_login') {
        setAuthMode('email-code');
        setOtpStep('email');
        setError('This account uses email code login.');
      } else {
        setError(apiErr.message ?? 'Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setResendStatus('sending');
    setResendError(false);
    try {
      await resendVerificationEmail(verifiedEmail);
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
      setResendError(true);
    }
  }

  async function handleSendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setOtpError(null);
    setIsSendingOtp(true);
    try {
      await requestLoginOtp(email);
      setOtpStep('code-sent');
      setOtpCode('');
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'otp_request_rate_limited') {
        setOtpError(
          formatRetryAfterMessage('Too many requests. Please try again later.', apiErr),
        );
      } else {
        setOtpError(apiErr.message ?? 'Failed to send code. Please try again.');
      }
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError(null);
    setIsVerifyingOtp(true);
    try {
      await verifyLoginOtp(email, otpCode);
      const next = searchParams.get('next');
      const destination =
        next && next.startsWith('/') && !/^\/[/\\]/.test(next) ? next : '/tasks';
      router.replace(destination);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'invalid_or_expired_code') {
        setOtpError('Invalid or expired code. Please try again.');
      } else if (apiErr.code === 'too_many_requests') {
        setOtpError('Too many attempts. Please try again later.');
      } else {
        setOtpError(apiErr.message ?? 'Verification failed. Please try again.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  async function handleResendOtp() {
    setResendOtpStatus('sending');
    setOtpError(null);
    try {
      await requestLoginOtp(email);
      setResendOtpStatus('sent');
      setOtpCode('');
      otpInputRef.current?.focus();
    } catch (err) {
      const apiErr = err as ApiError;
      setResendOtpStatus('idle');
      if (apiErr.code === 'otp_request_rate_limited') {
        setOtpError(
          formatRetryAfterMessage('Too many requests. Please try again later.', apiErr),
        );
      } else {
        setOtpError('Failed to resend code. Please try again.');
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {searchParams.get('expired') === 'true' && (
        <div role="status" className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Your session has expired — please sign in again.
        </div>
      )}

      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your todo4 account</p>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to our{' '}
        <Link
          href="/terms"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Terms
        </Link>
        {' '}and{' '}
        <Link
          href="/privacy"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Privacy Notice
        </Link>
        .
      </p>

      {/* OAuth buttons */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50"
          onClick={() => {
            const next = searchParams.get('next');
            if (next) document.cookie = `oauth_next=${encodeURIComponent(next)}; path=/; max-age=600; SameSite=Lax`;
            window.location.href = '/api/v1/auth/google';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
        {/* Facebook login hidden — requires business entity verification */}
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Auth mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
            authMode === 'password'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => { setAuthMode('password'); setError(null); setOtpError(null); }}
        >
          Email &amp; password
        </button>
        <button
          type="button"
          className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
            authMode === 'email-code'
              ? 'bg-primary text-primary-foreground'
              : 'bg-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => { setAuthMode('email-code'); setError(null); setOtpError(null); }}
        >
          Email code
        </button>
      </div>

      {/* Password login form */}
      {authMode === 'password' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setIsEmailNotVerified(false); setResendStatus('idle'); setResendError(false); }}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setIsEmailNotVerified(false); setResendStatus('idle'); setResendError(false); }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
              {isEmailNotVerified && (
                <>
                  {' '}
                  {resendStatus === 'sent' ? (
                    <span className="text-muted-foreground">Verification email sent.</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendStatus === 'sending'}
                        className="underline hover:no-underline disabled:opacity-50"
                      >
                        {resendStatus === 'sending' ? 'Sending...' : 'Resend verification email'}
                      </button>
                      {resendError && (
                        <span className="ml-1">Failed to send. Try again.</span>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      )}

      {/* Email code login flow */}
      {authMode === 'email-code' && otpStep === 'email' && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="otp-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="otp-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setOtpError(null); }}
              placeholder="you@example.com"
            />
          </div>

          {otpError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {otpError}
            </div>
          )}

          {error && authMode === 'email-code' && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSendingOtp || !email}>
            {isSendingOtp ? 'Sending...' : 'Send code'}
          </Button>

          <button
            type="button"
            className="text-sm text-primary hover:underline text-center"
            onClick={() => { setAuthMode('password'); setError(null); setOtpError(null); }}
          >
            Sign in with password instead
          </button>
        </form>
      )}

      {authMode === 'email-code' && otpStep === 'code-sent' && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to <strong className="text-foreground">{email}</strong>
          </p>

          <button
            type="button"
            className="text-sm text-primary hover:underline text-left"
            onClick={() => { setOtpStep('email'); setOtpCode(''); setOtpError(null); }}
          >
            &larr; Use a different email
          </button>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="otp-code" className="text-sm font-medium">
              Verification code
            </label>
            <Input
              ref={otpInputRef}
              id="otp-code"
              type="text"
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              autoFocus
              required
              value={otpCode}
              onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); setOtpError(null); }}
              placeholder="000000"
            />
          </div>

          {otpError && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {otpError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isVerifyingOtp || otpCode.length < 6}>
            {isVerifyingOtp ? 'Verifying...' : 'Verify'}
          </Button>

          <div className="text-center text-sm">
            {resendOtpStatus === 'sent' ? (
              <span className="text-muted-foreground">Code resent.</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendOtpStatus === 'sending'}
                className="text-primary hover:underline disabled:opacity-50"
              >
                {resendOtpStatus === 'sending' ? 'Sending...' : 'Resend code'}
              </button>
            )}
          </div>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
