'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  MarketingBackground,
  marketingBackgroundClassName,
} from '@/components/marketing/marketing-background';
import { cn } from '@/lib/utils';
import { exchangeWebLoginCode } from '@/lib/api/auth';

type ExchangeState = 'loading' | 'expired';

const SESSION_KEY_PREFIX = 'todo4-web-login-code:';

function AuthCodeExchange() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('c');

  const [state, setState] = useState<ExchangeState>(
    code ? 'loading' : 'expired',
  );

  // Guards against React StrictMode's double-invocation of effects in dev and
  // against the back-navigation case where the same page re-mounts with a now-
  // used code. sessionStorage survives remounts; the ref handles the dev race
  // where both effect runs fire before state is committed.
  const startedRef = useRef(false);

  useEffect(() => {
    if (!code) {
      return;
    }

    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    const sessionKey = `${SESSION_KEY_PREFIX}${code}`;
    if (
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(sessionKey) === 'ok'
    ) {
      router.replace('/tasks');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await exchangeWebLoginCode(code);
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(sessionKey, 'ok');
        }
        if (cancelled) return;
        router.replace('/tasks');
      } catch {
        if (cancelled) return;
        setState('expired');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, router]);

  if (state === 'loading') {
    return (
      <div
        className="flex flex-col items-center gap-3 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm">Signing you in…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="text-2xl font-bold tracking-tight">
        This link has expired or was already used.
      </h1>
      <p className="text-sm text-muted-foreground">
        Ask your AI agent to send a new link.
      </p>
      <Link
        href="/login"
        className="text-sm text-primary hover:underline"
      >
        Or sign in with your email
      </Link>
    </div>
  );
}

export default function AuthCodePage() {
  return (
    <main
      className={cn(
        marketingBackgroundClassName,
        'flex min-h-screen items-center justify-center px-4 py-12',
      )}
    >
      <MarketingBackground />
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <Suspense
            fallback={
              <div
                className="flex flex-col items-center gap-3 text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <Loader2
                  className="h-6 w-6 animate-spin text-primary"
                  aria-hidden="true"
                />
                <p className="text-sm">Signing you in…</p>
              </div>
            }
          >
            <AuthCodeExchange />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
