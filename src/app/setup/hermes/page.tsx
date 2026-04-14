import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Info, Sparkles, Terminal } from 'lucide-react';
import {
  MarketingBackground,
  marketingBackgroundClassName,
} from '@/components/marketing/marketing-background';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { CommandBlock } from '@/components/setup/command-block';
import { SetupCtaButtons } from '@/components/setup/setup-cta-buttons';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Connect Todo4 to Hermes Agent — Todo4',
  description:
    'Install the Todo4 Hermes plugin and connect your account by email OTP. Works with Hermes chat, Telegram, and WhatsApp sessions.',
};

const installSteps = [
  {
    text: 'Install the plugin into ~/.hermes/plugins/todo4/.',
    command: 'hermes plugins install https://github.com/panitw/todo4-hermes-plugin',
  },
  {
    text: 'Start a chat session so Hermes runs the plugin\u2019s register() hook — this installs the bundled todo4-onboard and todo4-work skills into ~/.hermes/skills/. You can exit immediately.',
    command: 'hermes chat        # then type /exit',
  },
  {
    text: 'Restart the gateway so Telegram/WhatsApp sessions pick up the new toolset. (Skip if you only use hermes chat locally.)',
    command: 'hermes gateway restart',
  },
];

const onboardSteps = [
  'Start a Hermes chat session.',
  'Paste the prompt above into the chat.',
  'When asked, provide your email — Todo4 sends a 6-digit verification code.',
  'Paste the code back into chat. The skill creates your account, connects this Hermes instance as your agent, and writes the MCP config automatically.',
  'Run `hermes gateway restart` (or `/reload-mcp`) so the Todo4 MCP tools activate.',
];

const verifySteps = [
  { command: 'hermes plugins list | grep todo4', note: 'enabled, v0.1.0, source=git' },
  { command: 'hermes skills list  | grep todo4', note: 'todo4-onboard + todo4-work, source=local' },
  { command: 'hermes tools list   | grep todo4', note: '\u2713 enabled  todo4  Todo4' },
];

export default function HermesSetupPage() {
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
            Connect Todo4 to Hermes Agent
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Install the Todo4 Hermes plugin, then connect your account by email
            OTP. Works with <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">hermes chat</code>{' '}
            and with gateway sessions (Telegram, WhatsApp). Takes about two minutes.
          </p>
        </section>

        {/* Prerequisite callout */}
        <aside
          role="note"
          className="mt-8 flex gap-3 rounded-lg border border-amber-200/60 bg-amber-50/50 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/20"
        >
          <Info
            size={18}
            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-500"
            aria-hidden="true"
          />
          <div className="text-amber-900 dark:text-amber-100">
            <strong className="font-semibold">Requires Hermes Agent</strong> with
            Python 3.9+ and a working <code className="rounded bg-amber-100/60 px-1 py-0.5 font-mono text-xs dark:bg-amber-900/40">hermes</code>{' '}
            CLI. See the{' '}
            <a
              href="https://hermes-agent.nousresearch.com/docs/guides/build-a-hermes-plugin"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-50"
            >
              Hermes plugin guide
            </a>{' '}
            for context on how plugins plug in.
          </div>
        </aside>

        {/* Step 1 — Install */}
        <section id="install" className="mt-12 scroll-mt-8">
          <div className="flex items-center gap-2">
            <Terminal size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Step 1 — Install the plugin</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Run these three commands in order. Step 2 matters:{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              hermes plugins install
            </code>{' '}
            does not run the plugin&apos;s <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">register()</code>{' '}
            — only a chat session does. Without it the bundled skills never get
            copied into <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">~/.hermes/skills/</code>.
          </p>

          <ol className="mt-6 space-y-5 text-sm text-foreground/90">
            {installSteps.map((step, i) => (
              <li key={i} className="leading-relaxed">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p>{step.text}</p>
                    <div className="mt-2">
                      <CommandBlock command={step.command} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6">
            <h3 className="text-sm font-semibold">Verify the install</h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground/90">
              {verifySteps.map((v, i) => (
                <li key={i} className="flex flex-col gap-1">
                  <CommandBlock command={v.command} />
                  <span className="pl-1 text-xs text-muted-foreground">
                    Expected: {v.note}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Step 2 — Onboard */}
        <section id="onboard" className="mt-12 scroll-mt-8">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Step 2 — Onboard via email OTP</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Hermes doesn&apos;t auto-match fuzzy phrases to skills reliably. Use this
            explicit prompt to run the onboarding flow:
          </p>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Paste this in chat</p>
            <CommandBlock
              command="Run the todo4-onboard skill"
              ariaLabel="Copy onboard prompt to clipboard"
            />
          </div>

          <ol className="mt-6 list-inside list-decimal space-y-3 text-sm text-foreground/90">
            {onboardSteps.map((step, i) => (
              <li key={i} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>

          <p className="mt-4 text-xs text-muted-foreground">
            Fallback prompt if the skill doesn&apos;t trigger:{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">
              Use todo4_register to sign me up — my email is you@example.com
            </code>
          </p>
        </section>

        {/* Test prompt */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Test your connection</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Back in Hermes, try one of these:
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
                &ldquo;Create a task to review the Q2 report by Friday, p2.&rdquo;
              </em>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-500"
                aria-hidden="true"
              />
              <em>&ldquo;Call todo4_status&rdquo;</em>{' '}
              <span className="text-xs text-muted-foreground">
                — reports whether the agent token, MCP entry, and API reachability are all good.
              </span>
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
              The onboarding skill creates one for you via email OTP. Or sign up
              first if you prefer.
            </p>
          </div>
          <SetupCtaButtons />
        </section>

        {/* Troubleshooting */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Troubleshooting</h2>
          <div className="mt-4 space-y-5 text-sm text-foreground/90">
            <div>
              <h3 className="font-medium">Skills don&apos;t show up after install</h3>
              <p className="mt-1 text-muted-foreground">
                Make sure you ran <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">hermes chat</code>{' '}
                at least once after install. The <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">register()</code>{' '}
                hook only fires when a chat session starts — that&apos;s when
                bundled skills get copied into{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">~/.hermes/skills/</code>.
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
              <h3 className="font-medium">MCP tools don&apos;t appear after onboarding</h3>
              <p className="mt-1 text-muted-foreground">
                Run{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                  hermes gateway restart
                </code>{' '}
                (or <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">/reload-mcp</code>{' '}
                inside chat) so the new MCP server entry is picked up. Confirm
                with <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">hermes tools list | grep todo4</code>.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Updating the plugin</h3>
              <p className="mt-1 text-muted-foreground">
                Hermes doesn&apos;t currently pull plugin updates in place when
                the version in <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">plugin.yaml</code>{' '}
                hasn&apos;t bumped. Uninstall + reinstall is the reliable path:
              </p>
              <div className="mt-2">
                <CommandBlock
                  command={
                    'hermes plugins uninstall todo4\n' +
                    'hermes plugins install https://github.com/panitw/todo4-hermes-plugin\n' +
                    'hermes chat        # then /exit\n' +
                    'hermes gateway restart'
                  }
                  ariaLabel="Copy update commands to clipboard"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
