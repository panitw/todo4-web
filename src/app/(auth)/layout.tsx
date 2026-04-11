import {
  MarketingBackground,
  marketingBackgroundClassName,
} from '@/components/marketing/marketing-background';
import { cn } from '@/lib/utils';
import { AuthBackLink } from './auth-back-link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className={cn(
        marketingBackgroundClassName,
        'flex min-h-screen items-center justify-center px-4 py-12',
      )}
    >
      <MarketingBackground />
      <div className="w-full max-w-sm">
        <AuthBackLink />
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}
