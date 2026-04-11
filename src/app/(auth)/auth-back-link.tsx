'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function AuthBackLink() {
  const pathname = usePathname();
  const isRegister = pathname === '/register';
  const href = isRegister ? '/login' : '/';
  const label = isRegister ? 'Back to sign in' : 'Back to home';

  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}
