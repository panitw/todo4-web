import type { Metadata } from 'next';
import { CheckCircle2, Info } from 'lucide-react';
import { DocsCopyCard } from '@/components/docs/docs-copy-card';
import { DocsCtaCard } from '@/components/docs/docs-cta-card';

const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || 'https://todo4.io/mcp';

export const metadata: Metadata = {
  title: 'Connect todo4 to Claude — todo4 docs',
  description:
    'Add todo4 as a Custom Connector in Claude in under a minute. Works in Claude Chat, Cowork, Code, and Desktop.',
};

const steps = [
  'In Claude, click the Customize icon in the sidebar.',
  'Select Connectors.',
  'Click Add custom connector.',
  'Name it "Todo4" and paste the URL above.',
  'Click Add. A browser tab opens for todo4 sign-in — approve the request and you\u2019re connected.',
] as const;

const tests = [
  '\u201cList my todo4 tasks.\u201d',
  '\u201cCreate a task to review the Q2 report by Friday, p2.\u201d',
  '\u201cWhat\u2019s on my plate this week?\u201d',
] as const;

export default function ClaudeConnectPage() {
  return (
    <article className="max-w-2xl">
      <header className="mb-6">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px] text-white/50">
          Connect your agent
        </div>
        <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-1px] md:text-[40px]">
          Claude
        </h1>
        <p className="mt-3 text-base leading-relaxed text-white/70">
          Add todo4 as a Custom Connector to let Claude create, query, and update your tasks
          directly from chat. Works in Claude Chat, Cowork, Code, and Desktop. Takes about 30
          seconds.
        </p>
      </header>

      <div
        role="note"
        className="mt-8 flex gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm"
      >
        <Info size={18} className="mt-0.5 shrink-0 text-amber-300" aria-hidden />
        <div className="text-amber-100">
          <strong className="font-semibold">Requires Claude Pro or Max.</strong> Custom Connectors
          aren&rsquo;t available on Claude&rsquo;s free tier as of April 2026.
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">
          Why the Custom Connector and not the plugin?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          todo4 also ships as a Claude Code plugin, but if you&rsquo;re installing it through
          Cowork specifically there&rsquo;s a known OAuth bug (
          <a
            href="https://github.com/anthropics/claude-code/issues/28695"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C4B8FF] underline-offset-2 hover:underline"
          >
            anthropics/claude-code #28695
          </a>
          ) that prevents plugin-supplied MCP servers from authenticating. The Custom Connector
          path below works reliably end-to-end across every Claude client.
        </p>
      </section>

      <section className="mt-10">
        <DocsCopyCard label="MCP Server URL" value={MCP_URL} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Setup steps</h2>
        <ol className="mt-4 flex flex-col gap-3">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-white/85">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6C4FE8] to-[#4F7FE5] text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-white">Test your connection</h2>
        <p className="mt-2 text-sm text-white/70">Back in Claude, try one of these:</p>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-white/85">
          {tests.map((t) => (
            <li key={t} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
              <em>{t}</em>
            </li>
          ))}
        </ul>
      </section>

      <DocsCtaCard
        title="Don’t have a todo4 account yet?"
        body="Sign up takes a minute. Or OAuth will create one for you on first sign-in."
      />

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">Troubleshooting</h2>
        <div className="mt-4 flex flex-col gap-5 text-sm text-white/85">
          <div>
            <h3 className="font-semibold text-white">
              Tools stop working after a long conversation (Cowork only)
            </h3>
            <p className="mt-1 text-white/65">
              Cowork has a known bug (
              <a
                href="https://github.com/anthropics/claude-code/issues/34832"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C4B8FF] underline-offset-2 hover:underline"
              >
                #34832
              </a>
              ) where OAuth tokens get stripped during context compaction. If todo4 stops
              responding, re-add the connector or start a new chat. Other Claude clients
              aren&rsquo;t affected.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white">The browser OAuth tab didn&rsquo;t open</h3>
            <p className="mt-1 text-white/65">
              Check your browser&rsquo;s popup blocker for the Claude domain you&rsquo;re on
              (claude.ai for web/Cowork, or your Desktop app). Click <strong>Add</strong> on the
              connector dialog again to retry.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white">I&rsquo;d rather use Claude Code CLI</h3>
            <p className="mt-1 text-white/65">
              The OAuth flow works end-to-end in the CLI. See the{' '}
              <a
                href="https://github.com/panitw/todo4-claude-plugin#claude-code-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C4B8FF] underline-offset-2 hover:underline"
              >
                todo4-claude-plugin README
              </a>{' '}
              for install instructions.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
