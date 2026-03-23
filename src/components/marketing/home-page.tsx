'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-8 text-center max-w-2xl">
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl font-bold tracking-tight text-foreground">todo4</span>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            AI-native task management
          </span>
        </div>

        {/* Value proposition */}
        <p className="text-lg text-muted-foreground leading-relaxed">
          Let your AI agent manage tasks while you stay in control.
          Built for teams that move fast and trust their tools.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'sm:min-w-36')}
          >
            Log in
          </Link>
          <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), 'sm:min-w-36')}>
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
