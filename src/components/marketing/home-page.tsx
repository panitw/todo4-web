'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bot, ShieldCheck, Bell, Plug } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MarketingBackground, marketingBackgroundClassName } from './marketing-background';
import { MarketingFooter } from './marketing-footer';

const features = [
  {
    icon: Bot,
    title: 'AI Agent Integration',
    description:
      'Your AI plans, prioritises, and executes tasks on your behalf. Connect your favourite agent and let it handle the busy-work.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust & Control',
    description:
      'Approve or reject agent actions before they take effect. Every change is audited so you always know what happened and why.',
  },
  {
    icon: Bell,
    title: 'Real-Time Visibility',
    description:
      'Watch your agent work in real time with instant notifications. Weekly summaries keep you informed even when you step away.',
  },
  {
    icon: Plug,
    title: 'Multi-Platform',
    description:
      'Connect Claude, ChatGPT, or any MCP-compatible agent. One platform, many assistants — your choice.',
  },
] as const;

const screenshots = [
  { src: '/screenshot1.png', alt: 'Todo4 — task list grouped by priority' },
  { src: '/screenshot2.png', alt: 'Todo4 — task detail with description and subtasks' },
  { src: '/screenshot3.png', alt: 'Todo4 — calendar view with scheduled tasks' },
  { src: '/screenshot4.png', alt: 'Todo4 — agent connections and integrations' },
] as const;

const platforms = [
  { name: 'OpenClaw', logo: '/openclaw.webp' },
  { name: 'Claude', logo: '/claude.svg' },
  { name: 'ChatGPT', logo: '/chatgpt.png' },
] as const;

function ScreenshotCarousel() {
  const [active, setActive] = useState(0);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % screenshots.length);
  }, []);

  // Auto-advance every 5 seconds, pause on hover
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 3000);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <section
      aria-label="Product screenshots"
      className="w-full px-4 pb-8 md:pb-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {screenshots.map((shot) => (
              <div key={shot.src} className="w-full shrink-0 cursor-pointer px-2" onClick={next}>
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={1200}
                  height={800}
                  className="mx-auto w-full max-w-4xl"
                  unoptimized
                  priority
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {screenshots.map((shot, i) => (
            <button
              key={shot.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show screenshot ${i + 1}`}
              className={cn(
                'h-2.5 rounded-full transition-all',
                i === active ? 'w-8 bg-primary' : 'w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <>
      <main className={cn(marketingBackgroundClassName, 'flex min-h-screen flex-col')}>
        <MarketingBackground />

        {/* Hero Section */}
        <div className="relative px-6 pt-12 pb-10 md:px-12 md:pt-20 md:pb-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-7 text-center">
            <Image
              src="/todo4-logo.png"
              alt="Todo4 logo"
              width={240}
              height={240}
              className="h-[18rem] w-[18rem] drop-shadow-[0_20px_40px_rgba(124,58,237,0.25)] md:h-[22rem] md:w-[22rem]"
              unoptimized
              priority
            />
            <h1 className="text-4xl font-bold tracking-[-0.02em] text-foreground md:text-6xl md:leading-[1.05]">
              AI does the work.<br />You stay in control.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground leading-relaxed md:text-xl">
              Finally, a task manager that speaks AI. Your agent plans, prioritises, and
              executes — so you can focus on what actually matters.
            </p>
            <div className="mt-2 flex flex-col items-center gap-3">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'gradient' }), 'h-12 px-8 text-base font-semibold sm:min-w-56')}
              >
                Start for free
              </Link>
              <span className="text-xs text-muted-foreground">
                No credit card · 60-second setup
              </span>
            </div>
          </div>
        </div>

        {/* Product Screenshots Carousel */}
        <ScreenshotCarousel />


        {/* Features Section */}
        <section aria-label="Platform features" className="w-full px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-14 text-center text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl">
              Built for the way AI works
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="mb-4 inline-flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-14 text-center">
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: 'gradient' }), 'h-12 px-8 text-base font-semibold sm:min-w-56')}
              >
                Start for free
              </Link>
            </div>
          </div>
        </section>

        {/* Supported Platforms Section */}
        <section aria-label="Supported platforms" className="w-full border-t border-border px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-14 text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl">
              Works with your favourite agents
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-5 md:gap-6">
              {platforms.map((platform) => (
                <div
                  key={platform.name}
                  className="group flex w-[160px] flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <Image
                    src={platform.logo}
                    alt={`${platform.name} logo`}
                    width={64}
                    height={64}
                    className="size-16 rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  <span className="text-sm font-medium text-foreground">
                    {platform.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MarketingFooter />
    </>
  );
}
