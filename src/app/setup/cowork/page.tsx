import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import {
  MarketingBackground,
  marketingBackgroundClassName,
} from '@/components/marketing/marketing-background';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { CopyUrlButton } from '@/components/setup/copy-url-button';
import { SetupCtaButtons } from '@/components/setup/setup-cta-buttons';
import { cn } from '@/lib/utils';

const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || 'https://todo4.io/mcp';

export const metadata: Metadata = {
  title: 'Connect Todo4 to Claude — Todo4',
  description:
    'Add Todo4 as a Custom Connector in Claude in under a minute. Works in Claude Chat, Cowork, Code, and Desktop. Step-by-step setup guide for the Todo4 MCP integration.',
};

const steps = [
  'In Claude, click the Customize icon in the sidebar.',
  'Select Connectors.',
  'Click Add custom connector.',
  'Name it "Todo4" and paste the URL above.',
  'Click Add. A browser tab opens for Todo4 sign-in — approve the request and you\'re connected.',
];

export default function CoworkSetupPage() {
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
            Connect Todo4 to Claude
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Add Todo4 as a Custom Connector to let Claude create, query, and
            update your tasks directly from chat. Works in Claude Chat,
            Cowork, Code, and Desktop. Takes about 30 seconds.
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
            <strong className="font-semibold">
              Requires Claude Pro or Max.
            </strong>{' '}
            Custom Connectors aren&apos;t available on Claude&apos;s free tier
            as of April 2026.
          </div>
        </aside>

        {/* Why Custom Connector, not Plugin */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">
            Why the Custom Connector and not the plugin?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Todo4 also ships as a Claude Code plugin, but if you&apos;re
            installing it through Cowork specifically there&apos;s a known
            OAuth bug (
            <a
              href="https://github.com/anthropics/claude-code/issues/28695"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              anthropics/claude-code #28695
            </a>
            ) that prevents plugin-supplied MCP servers from authenticating.
            The Custom Connector path below works reliably end-to-end across
            every Claude client.
          </p>
        </section>

        {/* MCP URL copy box */}
        <section className="mt-10">
          <CopyUrlButton value={MCP_URL} label="MCP Server URL" />
        </section>

        {/* Steps */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Setup steps</h2>
          <ol className="mt-4 list-inside list-decimal space-y-3 text-sm text-foreground/90">
            {steps.map((step, i) => (
              <li key={i} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </section>

        {/* Test prompt */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Test your connection</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Back in Claude, try one of these:
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
              Sign up takes a minute. Or OAuth will create one for you on first
              sign-in.
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
                Tools stop working after a long conversation (Cowork only)
              </h3>
              <p className="mt-1 text-muted-foreground">
                Cowork has a known bug (
                <a
                  href="https://github.com/anthropics/claude-code/issues/34832"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  #34832
                </a>
                ) where OAuth tokens get stripped during context compaction. If
                Todo4 stops responding, re-add the connector or start a new
                chat. Other Claude clients aren&apos;t affected.
              </p>
            </div>
            <div>
              <h3 className="font-medium">
                The browser OAuth tab didn&apos;t open
              </h3>
              <p className="mt-1 text-muted-foreground">
                Check your browser&apos;s popup blocker for the Claude domain
                you&apos;re on (claude.ai for web/Cowork, or your Desktop app).
                Click <strong>Add</strong> on the connector dialog again to
                retry.
              </p>
            </div>
            <div>
              <h3 className="font-medium">
                I&apos;d rather use Claude Code CLI
              </h3>
              <p className="mt-1 text-muted-foreground">
                The OAuth flow works end-to-end in the CLI. See the{' '}
                <a
                  href="https://github.com/panitw/todo4-claude-plugin#claude-code-cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  todo4-claude-plugin README
                </a>{' '}
                for install instructions.
              </p>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
