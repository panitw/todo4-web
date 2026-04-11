'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { logout } from '@/lib/api/auth';
import { getProfile, recordConsent } from '@/lib/api/users';

export function WelcomeTermsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: getProfile });

  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => {
    const nextRaw = searchParams.get('next');
    return nextRaw &&
      nextRaw.startsWith('/') &&
      !/^\/[/\\]/.test(nextRaw) &&
      !nextRaw.startsWith('/welcome/')
      ? nextRaw
      : '/tasks';
  }, [searchParams]);

  useEffect(() => {
    if (!profile) return;
    if (profile.deletionScheduledAt !== null) {
      router.replace('/tasks');
      return;
    }
    if (
      profile.tosVersion === profile.currentTosVersion &&
      profile.privacyVersion === profile.currentPrivacyVersion
    ) {
      router.replace(nextPath ?? '/tasks');
    }
  }, [nextPath, profile, router]);

  const firstName = profile?.name?.split(' ')[0] ?? null;

  async function handleAccept() {
    if (!profile) return;

    setSubmitting(true);
    setError(null);
    try {
      const updated = await recordConsent(
        profile.currentTosVersion,
        profile.currentPrivacyVersion,
      );
      queryClient.setQueryData(['profile'], updated);
      router.replace(nextPath);
    } catch (err) {
      const apiErr = err as Error & { code?: string };
      if (apiErr.code === 'consent_version_mismatch') {
        // Server has newer required versions than what the cached profile saw.
        // Invalidate so the next render pulls fresh `currentTosVersion` /
        // `currentPrivacyVersion` and the user can re-accept against them.
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        setError('The terms were just updated — please review and accept again.');
      } else {
        setError('Could not save your acceptance. Please try again.');
      }
      setSubmitting(false);
    }
  }
  async function handleSignOut() {
    try {
      await logout();
    } finally {
      queryClient.clear();
      router.push('/');
    }
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="Todo4 homepage">
          <Image
            src="/todo4-logo.png"
            alt="Todo4"
            width={112}
            height={32}
            className="h-8 w-auto"
            unoptimized
          />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 pb-16">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to Todo4{firstName ? `, ${firstName}` : ''}
        </h1>

        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          Before we continue, please review our Terms and Conditions and Privacy
          Notice. These explain your rights, responsibilities, and how we handle
          your data while you use Todo4.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          You only need to do this when policies are first accepted or updated.
          We will ask again only when a newer version requires re-acceptance.
        </p>

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link
            href="/terms"
            target="_blank"
            rel="noopener"
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Read Terms and Conditions
          </Link>
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener"
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Read Privacy Notice
          </Link>
        </div>

        <div className="mt-8 rounded-xl border border-border p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-input"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I have read and agree to the Terms and Conditions and the Privacy
              Notice
            </span>
          </label>

          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={handleAccept}
              disabled={!agreed || submitting}
            >
              {submitting ? 'Saving...' : 'Accept and Continue'}
            </Button>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
