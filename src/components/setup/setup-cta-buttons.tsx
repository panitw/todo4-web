'use client';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SetupCtaButtons() {
  return (
    <div className="flex gap-2 sm:shrink-0">
      <Link
        href="/register"
        className={cn(buttonVariants({ variant: 'gradient' }))}
      >
        Sign up free
      </Link>
      <Link
        href="/login"
        className={cn(buttonVariants({ variant: 'outline' }))}
      >
        Sign in
      </Link>
    </div>
  );
}
