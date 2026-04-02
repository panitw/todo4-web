'use client';

import Image from 'next/image';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-8 text-center max-w-2xl">
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/todo4-logo.png"
            alt="todo4 logo"
            width={320}
            height={320}
            className="max-w-full h-auto"
            unoptimized
            priority
          />
          <h1 className="text-5xl font-bold tracking-tight text-foreground">Todo4</h1>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            AI-native task management
          </span>
        </div>

        {/* Value proposition */}
        <p className="text-lg text-muted-foreground leading-relaxed">
          Finally, a task manager that speaks AI. Your agent plans,
          prioritizes, and executes — so you can focus on what actually matters.
        </p>

        {/* CTA */}
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: 'gradient', size: 'lg' }), 'sm:min-w-48')}
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}
