'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bot, ShieldCheck, Bell, Plug } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

const platforms = [
  { name: 'OpenClaw', logo: '/openclaw.webp' },
  { name: 'Claude', logo: '/claude.svg' },
  { name: 'ChatGPT', logo: '/chatgpt.png' },
] as const;

export function HomePage() {
  return (
    <>
      <main className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <div className="px-6 pt-12 pb-8 md:px-12 md:pt-20 md:pb-12">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <Image
              src="/todo4-logo.png"
              alt="Todo4 logo"
              width={240}
              height={240}
              className="h-56 w-56 md:h-[17rem] md:w-[17rem]"
              unoptimized
              priority
            />
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              AI does the work.<br />You stay in control.
            </h1>
            <p className="max-w-lg text-base text-muted-foreground leading-relaxed">
              Finally, a task manager that speaks AI. Your agent plans, prioritises, and
              executes — so you can focus on what actually matters.
            </p>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'gradient' }), 'h-12 px-8 text-base font-semibold sm:min-w-56')}
            >
              Start for free
            </Link>
          </div>
        </div>

        {/* Product Screenshots */}
        <section aria-label="Product screenshots" className="w-full px-4 pb-8 md:pb-12">
          <div className="mx-auto max-w-5xl">
            <Image
              src="/screenshot1.png"
              alt="Todo4 app — task list with AI agent activity"
              width={1200}
              height={800}
              className="mx-auto w-full max-w-4xl"
              unoptimized
              priority
            />
          </div>
        </section>


        {/* Features Section */}
        <section aria-label="Platform features" className="w-full px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Built for the way AI works
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-border bg-card p-6 shadow-sm"
                >
                  <feature.icon className="mb-3 size-6 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
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
        <section aria-label="Supported platforms" className="w-full border-t border-border px-4 py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-10 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Works with your favourite agents
            </h2>

            <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
              {platforms.map((platform) => (
                <div key={platform.name} className="flex flex-col items-center gap-3">
                  <Image
                    src={platform.logo}
                    alt={`${platform.name} logo`}
                    width={64}
                    height={64}
                    className="size-16 rounded-xl object-contain"
                    unoptimized
                  />
                  <span className="text-sm font-medium text-muted-foreground">
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
