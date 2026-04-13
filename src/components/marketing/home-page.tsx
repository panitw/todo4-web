'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bot, ShieldCheck, Bell, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MarketingBackground, marketingBackgroundClassName } from './marketing-background';
import { MarketingFooter } from './marketing-footer';

const MCP_URL = (process.env.NEXT_PUBLIC_MCP_URL ?? '').trim() || 'https://todo4.io/mcp';

type Platform = 'openclaw' | 'claude' | 'chatgpt';

const platforms = [
  {
    id: 'openclaw' as Platform,
    name: 'OpenClaw',
    logo: '/openclaw.webp',
    tagline: 'Install the skill from chat',
    disabled: false,
  },
  {
    id: 'claude' as Platform,
    name: 'Claude Cowork',
    logo: '/claude.svg',
    tagline: 'Add a custom connector',
    disabled: false,
  },
  {
    id: 'chatgpt' as Platform,
    name: 'ChatGPT',
    logo: '/chatgpt.png',
    tagline: 'Coming soon',
    disabled: true,
  },
] as const;

const trustBlocks = [
  {
    icon: Bot,
    title: 'Agent-first, not agent-added',
    description:
      '18 purpose-built MCP tools. Duplicate detection. Natural language dates. Your agent doesn\u2019t need a manual.',
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-600/10',
  },
  {
    icon: ShieldCheck,
    title: 'Trust you can see',
    description:
      'Destructive actions require your approval. Every action logged with reasoning. Nothing permanently deleted for a year.',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-600/10',
  },
  {
    icon: Bell,
    title: 'Know when it\u2019s your turn',
    description:
      'Needs Attention collects everything that\u2019s waiting on you. Resolve pending items in under 2 minutes.',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
] as const;

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied!');
      setCopied(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Unable to copy. Please copy manually.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn("rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200", className ?? "absolute top-3 right-3")}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
}

function StepBadge({ number }: { number: number }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
      {number}
    </span>
  );
}

function StepConnector({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)} aria-hidden="true">
      {/* Vertical line on mobile only — desktop relies on numbered badges for flow */}
      <div className="h-8 w-px bg-border md:hidden" />
    </div>
  );
}

function Step2Content({ platform }: { platform: Platform }) {
  if (platform === 'openclaw') {
    const installPrompt = 'Install and set me up with Todo4: https://github.com/panitw/todo4-onboard-skill';
    return (
      <div>
        <h4 className="mb-3 text-base font-semibold text-foreground">Paste this in chat</h4>
        <div className="rounded-lg bg-zinc-900 p-4 font-mono text-sm text-zinc-100">
          <div className="flex items-start justify-between gap-3">
            <span className="break-all">{installPrompt}</span>
            <CopyButton text={installPrompt} className="shrink-0 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100" />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          OpenClaw installs the <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">/todo4-onboard</code> skill
          from GitHub, then runs it &mdash; account, verification, and agent connection. No browser needed.
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          Already installed? Just say{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono">&ldquo;Set me up with Todo4&rdquo;</code>.
        </p>
      </div>
    );
  }

  if (platform === 'claude') {
    return (
      <div>
        <h4 className="mb-3 text-base font-semibold text-foreground">Add a custom connector</h4>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <span className="block text-xs font-medium text-zinc-600 mb-1">Name</span>
            <span className="text-sm font-medium text-foreground">Todo4</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <span className="block text-xs font-medium text-zinc-600 mb-1">Remote MCP server URL</span>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-foreground">{MCP_URL}</code>
              <CopyButton text={MCP_URL} className="shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground" />
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Go to Customize &rarr; Connectors &rarr; Add custom connector.
          OAuth will prompt on first use.
        </p>
        <p className="mt-3 text-sm">
          <Link
            href="/setup/cowork"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Step-by-step setup guide &rarr;
          </Link>
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Works with Claude Desktop, Claude Code, and any MCP-compatible client.
        </p>
      </div>
    );
  }

  // chatgpt
  return (
    <div>
      <h4 className="mb-3 text-base font-semibold text-foreground">Coming soon</h4>
      <p className="text-sm text-zinc-600">
        ChatGPT integration via OpenAI Apps SDK is in development. Sign up to get notified.
      </p>
      <div className="mt-4 flex gap-2">
        <input
          type="email"
          placeholder="Enter your email"
          className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/50"
          aria-label="Email for ChatGPT notification"
        />
        <button
          type="button"
          className={cn(buttonVariants({ variant: 'default', size: 'default' }), 'shrink-0')}
        >
          Notify me
        </button>
      </div>
    </div>
  );
}

export function HomePage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('openclaw');

  return (
    <>
      <main className={cn(marketingBackgroundClassName, 'flex flex-col')}>
        <MarketingBackground />

        {/* Hero Section */}
        <section aria-label="Hero" className="relative flex min-h-[calc(100vh-60px)] items-center px-6 pt-12 pb-10 md:px-12 md:pt-20 md:pb-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
            <Image
              src="/todo4-logo.png"
              alt="Todo4 logo"
              width={240}
              height={240}
              className="h-[12rem] w-[12rem] drop-shadow-[0_20px_40px_rgba(124,58,237,0.25)] md:h-[14rem] md:w-[14rem]"
              unoptimized
              priority
            />
            <h1 className="text-4xl font-bold tracking-[-0.02em] text-foreground md:text-5xl md:leading-[1.05]">
              Your agent&rsquo;s task manager.
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              Connect your AI agent. It handles the tasks. You review what matters.
            </p>

            {/* Platform badges */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {platforms.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none"
                >
                  <Image
                    src={p.logo}
                    alt={`${p.name} logo`}
                    width={32}
                    height={32}
                    className="size-5 rounded object-contain"
                    unoptimized
                  />
                  {p.name}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="mt-2 flex flex-col items-center gap-3">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: 'gradient' }),
                  'h-12 px-8 text-base font-semibold sm:min-w-56',
                )}
              >
                Get Started Free
              </Link>
              <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section aria-label="Getting started" className="w-full border-t border-border px-4 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-center text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl">
            Get started in 3 steps
          </h2>

          {/* Steps — vertical mobile, 5-col grid on desktop (step–line–step–line–step) */}
          <div className="flex flex-col gap-0 md:grid md:grid-cols-[1fr_4rem_1fr_4rem_1fr] md:items-start md:gap-0">

            {/* Step 1: Pick your platform */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="mb-4 flex items-center gap-2">
                <StepBadge number={1} />
                <h3 className="text-lg font-semibold text-foreground">Pick your platform</h3>
              </div>
              <div className="flex w-full flex-col gap-3">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={p.disabled}
                    onClick={() => !p.disabled && setSelectedPlatform(p.id)}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl border p-4 text-left shadow-sm transition-all duration-200 motion-reduce:transition-none',
                      p.disabled
                        ? 'cursor-not-allowed border-border bg-card opacity-50'
                        : selectedPlatform === p.id
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
                    )}
                    aria-pressed={selectedPlatform === p.id}
                  >
                    <Image
                      src={p.logo}
                      alt={`${p.name} logo`}
                      width={48}
                      height={48}
                      className="size-10 rounded-lg object-contain"
                      unoptimized
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      <span className="block text-xs text-zinc-600">{p.tagline}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <StepConnector />

            {/* Step 2: Connect */}
            <div className="flex flex-col items-center md:items-start">
              <div className="mb-4 flex items-center gap-2">
                <StepBadge number={2} />
                <h3 className="text-lg font-semibold text-foreground">Connect</h3>
              </div>
              <div className="w-full">
                <Step2Content platform={selectedPlatform} />
              </div>
            </div>

            <StepConnector />

            {/* Step 3: Try your first task */}
            <div className="flex flex-col items-center md:items-start">
              <div className="mb-4 flex items-center gap-2">
                <StepBadge number={3} />
                <h3 className="text-lg font-semibold text-foreground">Ask your agent</h3>
              </div>
              <div className="w-full">
                {/* Chat bubble */}
                <div className="mb-4 rounded-2xl rounded-bl-sm border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    &ldquo;Create a task to review the Q2 report by Friday&rdquo;
                  </p>
                </div>

                {/* Task mock-up */}
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-4 rounded border border-border" aria-hidden="true" />
                      <span className="text-sm font-medium text-foreground">Review the Q2 report</span>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-600">Due Friday</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                      <Bot className="size-3" /> Created by Claude Cowork
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-center text-sm text-zinc-600 md:text-left">
                  Your agent creates. You see it instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Trust Section */}
        <section aria-label="Why todo4" className="w-full border-t border-border px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl">
              Built different
            </h2>

            <div className="flex flex-col gap-8">
              {trustBlocks.map((block) => (
                <div key={block.title} className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-lg',
                      block.iconBg,
                    )}
                  >
                    <block.icon className={cn('size-5', block.iconColor)} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{block.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                      {block.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: 'gradient' }),
                  'h-12 px-8 text-base font-semibold sm:min-w-56',
                )}
              >
                Start for free
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <MarketingFooter />
    </>
  );
}
