import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Plug,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  MarketingBackground,
  marketingBackgroundClassName,
} from '@/components/marketing/marketing-background';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { CommandBlock } from '@/components/setup/command-block';
import { SetupCtaButtons } from '@/components/setup/setup-cta-buttons';
import { cn } from '@/lib/utils';

const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || 'https://todo4.io/mcp';
const SKILL_PROMPT =
  'Install and set me up with Todo4: https://github.com/panitw/todo4-onboard-skill';
const PLUGIN_SPEC = '@panitw/todo4-openclaw-plugin';

export const metadata: Metadata = {
  title: 'Connect Todo4 to OpenClaw — Todo4',
  description:
    'Connect Todo4 to OpenClaw three ways: paste an install prompt in chat, install the npm plugin, or wire it up manually with MCPorter.',
};

const skillSteps = [
  'Open OpenClaw on your machine.',
  'Paste the prompt above into a new chat.',
  'When asked, provide your email — Todo4 sends a 6-digit verification code.',
  'Paste the code back into chat. OpenClaw connects itself automatically (account, MCP config, and agent token are all wired up for you).',
];

const pluginSteps = [
  {
    text: 'Install the Todo4 plugin from npm.',
    command: `openclaw plugins install ${PLUGIN_SPEC}`,
  },
  {
    text: 'Restart the gateway so OpenClaw loads the plugin tools and the bundled onboarding skill.',
    command: 'openclaw gateway restart',
  },
  {
    text: 'In chat, ask the agent to onboard you. The bundled todo4-onboard skill walks you through email OTP, verifies the code, and wires up MCP automatically.',
    note: (
      <>
        Try any of:
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              &ldquo;Run the todo4-onboard skill&rdquo;
            </code>
          </li>
          <li>
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              &ldquo;Set me up with Todo4&rdquo;
            </code>
          </li>
          <li>
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              &ldquo;Sign me up for Todo4&rdquo;
            </code>
          </li>
        </ul>
      </>
    ),
  },
];

const mcporterSteps = [
  {
    text: 'Make sure OpenClaw is installed.',
    note: (
      <>
        See{' '}
        <a
          href="https://github.com/openclaw/openclaw"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          github.com/openclaw/openclaw
        </a>{' '}
        for installation instructions.
      </>
    ),
  },
  {
    text: 'Install MCPorter (Node.js 20+ required).',
    command: 'npm install -g mcporter',
  },
  {
    text: 'Add Todo4 to MCPorter.',
    command: `mcporter config add todo4 --url ${MCP_URL} --scope home --auth oauth`,
  },
  {
    text: 'Authenticate. A browser tab opens for Todo4 sign-in — approve the request.',
    command: 'mcporter auth todo4',
  },
  {
    text: 'Restart the OpenClaw gateway so it picks up the new MCP server.',
    command: 'openclaw gateway restart',
  },
];

export default function OpenclawSetupPage() {
  return (
    <div
      className={cn(
        marketingBackgroundClassName,
        'flex min-h-screen flex-col text-foreground',
      )}
    >
      <MarketingBackground />

      {/* Top bar */}
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="Todo4 homepage">
          <Image
            src="/todo4-logo.png"
            alt="Todo4"
            width={224}
            height={64}
            className="h-16 w-auto"
            unoptimized
          />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-16">
        {/* Hero */}
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Connect Todo4 to OpenClaw
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Three paths, same result: a chat-driven skill install, an npm
            plugin, or a manual wiring with MCPorter — pick whichever matches
            how you already work.
          </p>
        </section>

        {/* Method picker callout */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <a
            href="#method-skill"
            className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <div className="flex items-center gap-2">
              <Sparkles
                size={18}
                className="text-primary"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold">
                Method 1 — Skill (recommended)
              </h2>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Paste a prompt in chat. Email OTP, no browser, no CLI. Best for
              first-time users.
            </p>
          </a>
          <a
            href="#method-plugin"
            className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <div className="flex items-center gap-2">
              <Plug size={18} className="text-primary" aria-hidden="true" />
              <h2 className="text-sm font-semibold">
                Method 2 — Plugin (npm)
              </h2>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Install an npm plugin that ships the onboarding tools and skill.
              Two commands, then chat. Best if you&apos;d rather not paste a
              prompt.
            </p>
          </a>
          <a
            href="#method-mcporter"
            className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <div className="flex items-center gap-2">
              <Terminal
                size={18}
                className="text-primary"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold">
                Method 3 — MCPorter (CLI)
              </h2>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Manual setup with terminal commands. Best if you already use
              MCPorter or want OAuth-only auth.
            </p>
          </a>
        </section>

        {/* Method 1 — Skill */}
        <section id="method-skill" className="mt-12 scroll-mt-8">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">
              Method 1 — Install via Skill
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            OpenClaw fetches the{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              /todo4-onboard
            </code>{' '}
            skill from GitHub and runs it. The skill creates your Todo4 account
            via email OTP, then writes the MCP config and agent token
            automatically. No browser tab, no token paste.
          </p>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Paste this in chat</p>
            <CommandBlock
              command={SKILL_PROMPT}
              ariaLabel="Copy install prompt to clipboard"
            />
          </div>

          <ol className="mt-6 list-inside list-decimal space-y-3 text-sm text-foreground/90">
            {skillSteps.map((step, i) => (
              <li key={i} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>

          <p className="mt-4 text-xs text-muted-foreground">
            Already installed the skill on a previous OpenClaw session? Just
            say{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">
              &ldquo;Set me up with Todo4&rdquo;
            </code>
            .
          </p>
        </section>

        {/* Method 2 — Plugin */}
        <section id="method-plugin" className="mt-12 scroll-mt-8">
          <div className="flex items-center gap-2">
            <Plug size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">
              Method 2 — Install via Plugin
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            The plugin{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              {PLUGIN_SPEC}
            </code>{' '}
            registers four Todo4 agent tools and installs a{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              todo4-onboard
            </code>{' '}
            skill into <code>~/.openclaw/skills/</code>. After you restart the
            gateway, just ask the agent to onboard you in chat.
          </p>

          <ol className="mt-6 space-y-5 text-sm text-foreground/90">
            {pluginSteps.map((step, i) => (
              <li key={i} className="leading-relaxed">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p>{step.text}</p>
                    {step.command && (
                      <div className="mt-2">
                        <CommandBlock command={step.command} />
                      </div>
                    )}
                    {step.note && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {step.note}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Method 3 — MCPorter */}
        <section id="method-mcporter" className="mt-12 scroll-mt-8">
          <div className="flex items-center gap-2">
            <Terminal size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">
              Method 3 — Install via MCPorter
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            For users who prefer terminal-based MCP server management. Uses
            standard OAuth (browser-based sign-in) instead of email OTP.
          </p>

          <ol className="mt-6 space-y-5 text-sm text-foreground/90">
            {mcporterSteps.map((step, i) => (
              <li key={i} className="leading-relaxed">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p>{step.text}</p>
                    {step.note && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {step.note}
                      </p>
                    )}
                    {step.command && (
                      <div className="mt-2">
                        <CommandBlock command={step.command} />
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Test prompt */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Test your connection</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Back in OpenClaw, try one of these:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-foreground/90">
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-500"
                aria-hidden="true"
              />
              <em>&ldquo;List my todo4 tasks.&rdquo;</em>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-500"
                aria-hidden="true"
              />
              <em>
                &ldquo;Create a task to review the Q2 report by Friday,
                p2.&rdquo;
              </em>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-500"
                aria-hidden="true"
              />
              <em>&ldquo;What&apos;s on my plate this week?&rdquo;</em>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-12 flex flex-col gap-3 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">
              Don&apos;t have a Todo4 account yet?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Method 1 creates one for you via email OTP. Or sign up first if
              you prefer.
            </p>
          </div>
          <SetupCtaButtons />
        </section>

        {/* Troubleshooting */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Troubleshooting</h2>
          <div className="mt-4 space-y-5 text-sm text-foreground/90">
            <div>
              <h3 className="font-medium">
                The skill doesn&apos;t install or run
              </h3>
              <p className="mt-1 text-muted-foreground">
                Make sure your OpenClaw version supports remote skill install
                from GitHub. If not, upgrade to the latest release or fall back
                to Method 2.
              </p>
            </div>
            <div>
              <h3 className="font-medium">
                I never received the verification code
              </h3>
              <p className="mt-1 text-muted-foreground">
                Check your spam folder. The skill rate-limits resends — if you
                hit the limit, wait a minute and ask the skill to send a new
                code.
              </p>
            </div>
            <div>
              <h3 className="font-medium">
                MCPorter says &ldquo;todo4 already exists&rdquo;
              </h3>
              <p className="mt-1 text-muted-foreground">
                You&apos;ve already added the connector. Run{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  mcporter auth todo4
                </code>{' '}
                to refresh authentication, or remove it first with{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  mcporter config remove todo4
                </code>
                .
              </p>
            </div>
            <div>
              <h3 className="font-medium">
                Tools don&apos;t show up after install
              </h3>
              <p className="mt-1 text-muted-foreground">
                Make sure you ran{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  openclaw gateway restart
                </code>{' '}
                so OpenClaw picks up the new MCP server.
              </p>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
