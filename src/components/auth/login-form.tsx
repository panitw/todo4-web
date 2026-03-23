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
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your todo4 account</p>
      </div>

      {/* OAuth buttons */}
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = '/api/v1/auth/google';
          }}
        >
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = '/api/v1/auth/facebook';
          }}
        >
          Continue with Facebook
        </Button>
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
          Get started
        </Link>
      </p>
    </div>
  );
}
