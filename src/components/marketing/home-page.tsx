'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bot, Copy, Check, ArrowRight, TriangleAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MCP_URL = (process.env.NEXT_PUBLIC_MCP_URL ?? '').trim() || 'https://todo4.io/mcp';

type Platform = 'openclaw' | 'claude' | 'hermes' | 'chatgpt';

const platforms = [
  {
    id: 'openclaw' as Platform,
    name: 'OpenClaw',
    logo: '/openclaw.webp',
    tagline: 'Install the skill from chat',
  },
  {
    id: 'claude' as Platform,
    name: 'Claude',
    logo: '/claude.svg',
    tagline: 'Add a custom connector',
  },
  {
    id: 'hermes' as Platform,
    name: 'Hermes',
    logo: '/hermes.png',
    tagline: 'Install the plugin',
  },
  {
    id: 'chatgpt' as Platform,
    name: 'ChatGPT',
    logo: '/chatgpt.png',
    tagline: 'Experimental (Developer mode)',
  },
] as const;

const worksWith = ['Claude', 'OpenClaw', 'Hermes', 'ChatGPT'] as const;

const features = [
  {
    kicker: 'Delegate',
    title: 'Hand tasks to an agent with one tap.',
    body: 'Pick an agent, set the guardrails, and watch the subtasks fill in. You approve what ships.',
    accent: '#8876FF',
  },
  {
    kicker: 'Observe',
    title: 'A full receipt for every move.',
    body: 'Every edit, comment, and tool call is logged. Scrub the timeline, roll back if needed.',
    accent: '#FF98C0',
  },
  {
    kicker: 'Decide',
    title: 'You always have the final say.',
    body: 'Agents propose; you dispose. Start working when you’re ready — not a second sooner.',
    accent: '#FFB088',
  },
] as const;

const chips = [
  { dot: '#FF5A3B', text: 'Ship onboarding copy', tag: 'To Do', agent: false, pos: { top: -14, left: -48 } },
  { dot: '#22B872', text: 'Review PR #482', tag: 'Done', agent: true, pos: { top: 72, right: -84 } },
  { dot: '#5B4FE5', text: 'Draft Q3 roadmap', tag: 'In progress', agent: true, pos: { bottom: 56, left: -84 } },
  { dot: '#FF9A3B', text: 'Sync with design', tag: 'Today', agent: false, pos: { bottom: -14, right: -32 } },
] as const;

const pricingFeatures = [
  'Unlimited tasks & projects',
  'Bring your own AI agents',
  'Email & calendar integrations',
  'Lock in early-adopter pricing forever',
] as const;

const footerLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'X / @todo4support', href: 'https://x.com/todo4support' },
] as const;

function TaskChip({ dot, text, tag, agent, pos }: typeof chips[number]) {
  return (
    <div
      style={pos}
      className="absolute hidden min-w-[180px] flex-col gap-1 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md backdrop-saturate-150 animate-nebula-float lg:flex"
    >
      <div className="flex items-center gap-2">
        <span className="size-[14px] rounded-[4px] border-[1.5px] border-white/40" />
        <span className="size-[7px] rounded-full" style={{ background: dot }} />
        <span className="text-[13px] font-semibold text-white">{text}</span>
      </div>
      <div className="ml-7 flex gap-1.5">
        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] text-white/80">{tag}</span>
        {agent && (
          <span className="rounded-full bg-[rgba(34,184,114,0.22)] px-2 py-0.5 text-[10px] text-[#7AE6B0]">
            <span aria-hidden>🤖</span> agent
          </span>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied!');
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Unable to copy. Please copy manually.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn('rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white', className)}
      aria-label="Copy to clipboard"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
}

function StepBadge({ number }: { number: number }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6C4FE8] to-[#4F7FE5] text-xs font-bold text-white shadow-[0_4px_14px_rgba(92,79,229,0.4)]">
      {number}
    </span>
  );
}

function StepConnector() {
  return (
    <div className="flex items-center justify-center" aria-hidden>
      <div className="h-8 w-px bg-white/10 md:hidden" />
    </div>
  );
}

function SetupField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <span className="mb-1 block text-xs font-medium text-white/60">{label}</span>
      {mono ? (
        <div className="flex items-center gap-2">
          <code className="font-mono text-sm text-white">{value}</code>
          <CopyButton text={value} className="shrink-0" />
        </div>
      ) : (
        <span className="text-sm font-medium text-white">{value}</span>
      )}
    </div>
  );
}

function SetupLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 font-medium text-[#C4B8FF] underline-offset-2 hover:underline">
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}

function Step2Content({ platform }: { platform: Platform }) {
  if (platform === 'openclaw') {
    const installPrompt = 'Install and set me up with Todo4: https://github.com/panitw/todo4-onboard-skill';
    return (
      <div>
        <h4 className="mb-3 text-base font-semibold text-white">Paste this in chat</h4>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-sm text-white">
          <div className="flex items-start justify-between gap-3">
            <span className="break-all">{installPrompt}</span>
            <CopyButton text={installPrompt} className="shrink-0" />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          OpenClaw installs the <code className="rounded bg-white/10 px-1 py-0.5 text-xs font-mono">/todo4-onboard</code> skill
          from GitHub, then runs it — account, verification, and agent connection. No browser needed.
        </p>
        <p className="mt-3 text-sm">
          <SetupLink href="/docs/connect/openclaw">More installation methods</SetupLink>
        </p>
      </div>
    );
  }

  if (platform === 'claude') {
    return (
      <div>
        <h4 className="mb-3 text-base font-semibold text-white">Add a custom connector</h4>
        <div className="flex flex-col gap-3">
          <SetupField label="Name" value="Todo4" />
          <SetupField label="Remote MCP server URL" value={MCP_URL} mono />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          Go to Customize → Connectors → Add custom connector. OAuth will prompt on first use.
        </p>
        <p className="mt-3 text-sm">
          <SetupLink href="/docs/connect/claude">Step-by-step setup guide</SetupLink>
        </p>
        <p className="mt-1 text-xs text-white/55">
          Works with Claude Desktop, Claude Code, and any MCP-compatible client.
        </p>
      </div>
    );
  }

  if (platform === 'hermes') {
    const installCommand = 'hermes plugins install https://github.com/panitw/todo4-hermes-plugin';
    return (
      <div>
        <h4 className="mb-3 text-base font-semibold text-white">Install the Hermes plugin</h4>
        <div className="rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-sm text-white">
          <div className="flex items-start justify-between gap-3">
            <span className="break-all">{installCommand}</span>
            <CopyButton text={installCommand} className="shrink-0" />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          A few more commands wire everything up, then you connect your account by email OTP from chat.
          No browser needed.
        </p>
        <p className="mt-3 text-sm">
          <SetupLink href="/docs/connect/hermes">Step-by-step setup guide</SetupLink>
        </p>
      </div>
    );
  }

  // chatgpt
  return (
    <div>
      <div
        role="alert"
        className="mb-4 flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3"
      >
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
        <div className="text-xs leading-relaxed text-amber-100">
          <strong className="font-semibold">Experimental — not reliable yet.</strong> ChatGPT custom
          connectors only work in Developer mode and often fail to invoke tools. For a stable
          experience, pick Claude or OpenClaw.
        </div>
      </div>
      <h4 className="mb-3 text-base font-semibold text-white">Create a developer app</h4>
      <div className="flex flex-col gap-3">
        <SetupField label="Name" value="Todo4" />
        <SetupField label="MCP Server URL" value={MCP_URL} mono />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/65">
        Go to Settings → Apps &amp; Connectors → Advanced settings, enable Developer mode, then click
        “Create app”. Accept the risk prompt and authorize Todo4.
      </p>
    </div>
  );
}

function PricingPopup({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-title"
      className="animate-pricing-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(6,6,18,0.72)] px-4 backdrop-blur-xl backdrop-saturate-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pricing-pop-in relative w-full max-w-[460px] overflow-hidden rounded-3xl border border-[rgba(180,160,255,0.18)] px-9 pt-10 pb-8 shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_120px_rgba(140,110,255,0.25)]"
        style={{
          background: 'linear-gradient(180deg, rgba(28,22,56,0.95) 0%, rgba(18,18,42,0.95) 100%)',
        }}
      >
        {/* corner glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-16 size-[260px] rounded-full blur-[30px]"
          style={{ background: 'radial-gradient(circle, rgba(230,100,140,0.3), transparent 70%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-16 size-[260px] rounded-full blur-[30px]"
          style={{ background: 'radial-gradient(circle, rgba(120,100,230,0.28), transparent 70%)' }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close pricing"
          className="absolute top-3.5 right-3.5 z-[2] flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition-colors hover:bg-white/[0.12] hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="relative z-[1]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(255,152,192,0.28)] bg-[rgba(255,152,192,0.14)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[1.2px] text-[#FFB8D0]">
            <span className="size-1.5 rounded-full bg-[#FF98C0] shadow-[0_0_10px_#FF98C0]" />
            Limited-time offer
          </div>

          <h2
            id="pricing-title"
            className="m-0 text-[36px] font-bold leading-[1.05] tracking-[-1.2px] text-white"
          >
            Free while we&rsquo;re
            <br />
            <span className="bg-gradient-to-r from-[#C4B8FF] via-[#FF98C0] to-[#FFB088] bg-clip-text font-semibold italic text-transparent">
              in early access.
            </span>
          </h2>

          <p className="mt-4 mb-7 text-[15px] leading-[1.55] text-white/70">
            todo4 is free to use for a limited time — every feature, unlimited tasks, unlimited agents.
            No credit card, no trial timer.
          </p>

          <ul className="mb-7 flex flex-col gap-3">
            {pricingFeatures.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/85">
                <span
                  aria-hidden
                  className="flex size-[18px] shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'linear-gradient(135deg, #8876FF, #FF98C0)' }}
                >
                  <Check size={10} strokeWidth={2.5} className="text-white" />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/login"
            onClick={onClose}
            className="flex h-[52px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#6C4FE8] to-[#4F7FE5] text-[15px] font-semibold tracking-[-0.2px] text-white shadow-[0_10px_28px_rgba(92,79,229,0.45)] transition-transform hover:-translate-y-0.5"
          >
            Get started — it&rsquo;s free
          </Link>

          <p className="mt-3.5 text-center text-xs leading-[1.5] text-white/50">
            We&rsquo;ll announce paid plans at least{' '}
            <span className="font-semibold text-[#C4B8FF]">30 days</span> before they go live.
            <br />
            Early users keep the best price.
          </p>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('openclaw');
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#0F1020] font-sans text-[#EDEDF5] antialiased">
      {/* Cosmic backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20"
        style={{
          background:
            'radial-gradient(ellipse at 20% 10%, rgba(110, 80, 220, 0.32), transparent 55%),' +
            'radial-gradient(ellipse at 80% 20%, rgba(230, 90, 140, 0.22), transparent 55%),' +
            'radial-gradient(ellipse at 60% 85%, rgba(90, 130, 230, 0.28), transparent 55%),' +
            'radial-gradient(ellipse at 15% 80%, rgba(255, 130, 90, 0.18), transparent 50%),' +
            'linear-gradient(180deg, #0B0B1A 0%, #0F1024 50%, #080816 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-80"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.8), transparent),' +
            'radial-gradient(1px 1px at 30% 70%, rgba(200,220,255,0.7), transparent),' +
            'radial-gradient(1.5px 1.5px at 70% 40%, rgba(255,220,240,0.7), transparent),' +
            'radial-gradient(1px 1px at 85% 80%, rgba(255,255,255,0.6), transparent),' +
            'radial-gradient(1px 1px at 50% 10%, rgba(180,200,255,0.8), transparent),' +
            'radial-gradient(1.5px 1.5px at 90% 30%, rgba(255,200,220,0.7), transparent),' +
            'radial-gradient(1px 1px at 25% 50%, rgba(255,255,255,0.5), transparent),' +
            'radial-gradient(1px 1px at 65% 90%, rgba(220,200,255,0.7), transparent)',
        }}
      />

      {/* Nav */}
      <nav aria-label="Main" className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 py-7 md:px-14">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/todo4-logo.png"
            alt=""
            width={36}
            height={36}
            className="size-9 object-contain"
            unoptimized
            priority
          />
          <span className="text-[22px] font-bold tracking-[-0.5px]">todo4</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <Link href="#get-started" className="font-medium transition-colors hover:text-white">Agents</Link>
          <button
            type="button"
            onClick={() => setPricingOpen(true)}
            className="font-medium text-white/70 transition-colors hover:text-white"
          >
            Pricing
          </button>
          <Link href="/docs" className="font-medium transition-colors hover:text-white">Docs</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline">
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-[10px] bg-gradient-to-r from-[#6C4FE8] to-[#4F7FE5] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(92,79,229,0.4)] transition-transform hover:-translate-y-0.5"
          >
            Get started
          </Link>
        </div>
      </nav>

      <main>
      {/* Hero */}
      <section aria-label="Hero" className="relative z-[3] mx-auto max-w-[1280px] px-6 pt-10 pb-16 md:px-14 md:pt-16 md:pb-24 lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-10">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(180,160,255,0.2)] bg-[rgba(120,100,230,0.15)] px-3.5 py-1.5 text-xs tracking-[0.6px] text-[#C4B8FF]">
            <span className="size-1.5 rounded-full bg-[#8876FF] shadow-[0_0_10px_#8876FF]" />
            NEW · MCP integrations · agent delegation
          </div>

          <h1 className="text-[44px] font-bold leading-[1.02] tracking-[-1.5px] md:text-[64px] md:tracking-[-2.5px] lg:text-[72px]">
            Task manager
            <br />
            <span className="bg-gradient-to-r from-[#C4B8FF] via-[#FF98C0] to-[#FFB088] bg-clip-text font-semibold italic text-transparent">
              for you and your AI agents.
            </span>
          </h1>

          <p className="mt-6 max-w-[520px] text-lg leading-[1.55] text-white/70 md:text-[19px]">
            Plan together, stay in the loop, keep the final say. todo4 is the shared workspace
            where humans and agents check off the same list — with receipts.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-gradient-to-r from-[#6C4FE8] to-[#4F7FE5] px-6 py-4 text-base font-semibold text-white shadow-[0_10px_30px_rgba(92,79,229,0.45)] transition-transform hover:-translate-y-0.5"
            >
              Create account
            </Link>
          </div>

          <div className="mt-11 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-white/55">
            <span>Works with</span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {worksWith.map((x) => (
                <span key={x} className="font-semibold tracking-[-0.2px] text-white/75">
                  {x}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Hero visual — nebula 4 with orbiting chips */}
        <div className="relative mt-14 flex h-[360px] items-center justify-center lg:mt-0 lg:h-[520px]">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-20 rounded-full blur-[30px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(120,100,230,0.45), rgba(230,100,150,0.18) 40%, transparent 70%)',
              }}
            />
            <div className="relative animate-nebula-float">
              <Image
                src="/todo4-logo.png"
                alt="todo4 nebula logo"
                width={360}
                height={360}
                className="relative size-[260px] object-contain drop-shadow-[0_20px_50px_rgba(120,100,230,0.45)] md:size-[320px] lg:size-[360px]"
                unoptimized
                priority
              />
            </div>
            {chips.map((c) => (
              <TaskChip key={c.text} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* Quick connect (Get started in 3 steps) */}
      <section
        id="get-started"
        aria-label="Get started"
        className="relative z-[3] border-t border-white/10 px-6 py-20 md:px-14 md:py-28"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-center text-[34px] font-bold leading-[1.1] tracking-[-1px] md:text-[44px] md:tracking-[-1.2px]">
            Get started in <span className="italic">3 steps.</span>
          </h2>

          <div className="flex flex-col gap-0 md:grid md:grid-cols-[1fr_4rem_1fr_4rem_1fr] md:items-start md:gap-0">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="mb-4 flex items-center gap-2">
                <StepBadge number={1} />
                <h3 className="text-lg font-semibold text-white">Pick your platform</h3>
              </div>
              <div className="flex w-full flex-col gap-3">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlatform(p.id)}
                    aria-pressed={selectedPlatform === p.id}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 motion-reduce:transition-none',
                      selectedPlatform === p.id
                        ? 'border-[#8876FF]/60 bg-[#8876FF]/10 shadow-[0_10px_30px_rgba(136,118,255,0.2)]'
                        : 'border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-[#8876FF]/40 hover:bg-white/[0.06]',
                    )}
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
                      <span className="text-sm font-medium text-white">{p.name}</span>
                      <span className="block text-xs text-white/55">{p.tagline}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <StepConnector />

            {/* Step 2 */}
            <div className="flex flex-col items-center md:items-start">
              <div className="mb-4 flex items-center gap-2">
                <StepBadge number={2} />
                <h3 className="text-lg font-semibold text-white">Connect</h3>
              </div>
              <div className="w-full">
                <Step2Content platform={selectedPlatform} />
              </div>
            </div>

            <StepConnector />

            {/* Step 3 */}
            <div className="flex flex-col items-center md:items-start">
              <div className="mb-4 flex items-center gap-2">
                <StepBadge number={3} />
                <h3 className="text-lg font-semibold text-white">Ask your agent</h3>
              </div>
              <div className="w-full">
                <div className="mb-4 rounded-2xl rounded-bl-sm border border-[#8876FF]/30 bg-[#8876FF]/10 px-4 py-3">
                  <p className="text-sm font-medium text-white">
                    “Create a task to review the Q2 report by Friday”
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-4 rounded border border-white/30" aria-hidden />
                      <span className="text-sm font-medium text-white">Review the Q2 report</span>
                    </div>
                    <span className="shrink-0 text-xs text-white/55">Due Friday</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(34,184,114,0.22)] px-2 py-0.5 text-xs font-medium text-[#7AE6B0]">
                      <Bot className="size-3" /> Created by Claude
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-center text-sm text-white/55 md:text-left">
                  Your agent creates. You see it instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-[3] mx-auto max-w-[1280px] px-6 py-24 md:px-14 md:py-32">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-14 md:flex-row md:items-end">
          <h2 className="m-0 max-w-[620px] text-[34px] font-bold leading-[1.1] tracking-[-1px] md:text-[44px] md:tracking-[-1.2px]">
            A todo list that <span className="italic">delegates.</span>
          </h2>
          <p className="m-0 max-w-[380px] text-[15px] leading-[1.55] text-white/65">
            Every task has a human, an agent, or both. todo4 keeps the handoffs clean and the
            history honest.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.kicker}
              className="relative overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.03] p-7 backdrop-blur-md"
            >
              <div
                aria-hidden
                className="absolute -top-8 -right-8 size-[120px] rounded-full opacity-35 blur-[50px]"
                style={{ background: f.accent }}
              />
              <div className="relative mb-4 text-[11px] font-bold uppercase tracking-[2px]" style={{ color: f.accent }}>
                {f.kicker}
              </div>
              <h3 className="relative mb-3 text-[22px] font-bold leading-[1.2] tracking-[-0.5px]">{f.title}</h3>
              <p className="relative m-0 text-sm leading-[1.55] text-white/65">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="relative z-[3] border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 px-6 py-10 text-[13px] text-white/50 md:flex-row md:items-center md:px-14">
          <div className="flex items-center gap-2.5">
            <Image
              src="/todo4-logo.png"
              alt=""
              width={22}
              height={22}
              className="size-[22px] object-contain"
              unoptimized
            />
            <span>© Panit Wechasil 2026 — Made for humans and agents.</span>
          </div>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((l) => {
              const external = l.href.startsWith('http');
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="font-medium text-white/70 transition-colors hover:text-white"
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </footer>

      {pricingOpen && <PricingPopup onClose={() => setPricingOpen(false)} />}
    </div>
  );
}
