'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, resendVerificationEmail } from '@/lib/api/auth';

type ApiError = Error & { code?: string };

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
        <button
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#1264CC] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#0E53AA]"
          onClick={() => {
            const next = searchParams.get('next');
            if (next) document.cookie = `oauth_next=${encodeURIComponent(next)}; path=/; max-age=600; SameSite=Lax`;
            window.location.href = '/api/v1/auth/facebook';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Continue with Facebook
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Email/password form */}
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
                      {resendStatus === 'sending' ? 'Sending…' : 'Resend verification email'}
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
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
