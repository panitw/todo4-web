import Link from 'next/link';

const links = [
  { label: 'Privacy Notice', href: '/privacy' },
  { label: 'Terms and Conditions', href: '/terms' },
  { label: 'Cookie Preferences', href: '#' },
] as const;

export function MarketingFooter() {
  return (
    <footer className="w-full bg-[#1e2a3a] text-zinc-400">
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <nav className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm">
          {links.map((link, i) => (
            <span key={link.href} className="flex items-center gap-1">
              {i > 0 && <span className="text-zinc-600" aria-hidden="true">·</span>}
              <Link
                href={link.href}
                className="hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded-sm"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
        <p className="mt-4 text-sm text-zinc-400">© Panit Wechasil 2026</p>
      </div>
    </footer>
  );
}
