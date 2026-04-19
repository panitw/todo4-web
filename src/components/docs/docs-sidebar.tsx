'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const sections = [
  {
    label: 'Connect your agent',
    items: [
      { label: 'Claude', href: '/docs/connect/claude' },
      { label: 'OpenClaw', href: '/docs/connect/openclaw' },
      { label: 'Hermes', href: '/docs/connect/hermes' },
    ],
  },
] as const;

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Docs" className="flex flex-col gap-8 py-8 pr-6 text-sm">
      {sections.map((section) => (
        <div key={section.label}>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[1.5px] text-white/50">
            {section.label}
          </div>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'block rounded-md px-3 py-2 transition-colors',
                      active
                        ? 'bg-white/[0.08] font-semibold text-white'
                        : 'text-white/65 hover:bg-white/[0.04] hover:text-white',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
