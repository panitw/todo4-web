'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { confirmEmailChange } from '@/lib/api/auth';

type ApiError = Error & { code?: string };

export function VerifyEmailChangeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Invalid confirmation link</h1>
        <p className="text-sm text-muted-foreground">
          This email-change link is invalid or missing. Please update your email again from settings.
        </p>
        <Link href="/settings" className="text-sm text-primary hover:underline">
          Back to settings
        </Link>
      </div>
    );
  }

  const rawToken = token;

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await confirmEmailChange(rawToken);
      router.replace(result.redirectUrl);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'invalid_email_change_token') {
        setError('This email change link is invalid or has expired.');
      } else if (apiErr.code === 'email_already_in_use') {
        setError('That email address is already in use. Please choose another one in settings.');
      } else {
        setError(apiErr.message ?? 'Unable to confirm email change. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Confirm your new email</h1>
        <p className="text-sm text-muted-foreground">
          Click confirm to complete this email address change.
        </p>
      </div>

      <form onSubmit={handleConfirm} className="flex flex-col gap-4">
        {error && (
          <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button type="submit" variant="gradient" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Confirming…' : 'Confirm email change'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Changed your mind?{' '}
        <Link href="/settings" className="text-primary hover:underline">
          Return to settings
        </Link>
      </p>
    </div>
  );
}
