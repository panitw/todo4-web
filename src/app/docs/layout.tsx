import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DocsSidebar } from '@/components/docs/docs-sidebar';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#0F1020] font-sans text-[#EDEDF5] antialiased">
      {/* Cosmic backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background:
            'radial-gradient(ellipse at 20% 10%, rgba(110, 80, 220, 0.24), transparent 55%),' +
            'radial-gradient(ellipse at 80% 20%, rgba(230, 90, 140, 0.16), transparent 55%),' +
            'linear-gradient(180deg, #0B0B1A 0%, #0F1024 50%, #080816 100%)',
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 md:px-10">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/todo4-logo.png"
              alt=""
              width={32}
              height={32}
              className="size-8 object-contain"
              unoptimized
              priority
            />
            <span className="text-lg font-bold tracking-[-0.5px]">todo4 docs</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="relative z-[3] mx-auto flex max-w-[1280px] flex-col gap-4 px-6 md:flex-row md:gap-6 md:px-10 lg:gap-10">
        <div className="shrink-0 border-b border-white/10 md:w-60 md:border-r md:border-b-0">
          <DocsSidebar />
        </div>
        <main className="min-w-0 flex-1 py-6 md:py-12">{children}</main>
      </div>
    </div>
  );
}
