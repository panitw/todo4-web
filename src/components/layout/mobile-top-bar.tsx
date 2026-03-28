'use client';

import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { BrandWordmark } from '@/components/shared/brand-wordmark';

export function MobileTopBar() {
  return (
    <header className="flex items-center justify-between px-4 py-2">
      <BrandWordmark variant="mobile" className="text-[22px]" />
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Notifications" className="text-muted-foreground">
          <Bell size={24} />
        </button>
        <Link href="/settings" aria-label="Settings" className="text-muted-foreground">
          <Settings size={24} />
        </Link>
      </div>
    </header>
  );
}
