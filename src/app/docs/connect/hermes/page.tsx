import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CheckCircle2, Info, Sparkles, Terminal } from 'lucide-react';
import { DocsCommandBlock } from '@/components/docs/docs-command-block';
import { DocsCtaCard } from '@/components/docs/docs-cta-card';

export const metadata: Metadata = {
  title: 'Connect todo4 to Hermes Agent — todo4 docs',
  description:
    'Install the todo4 Hermes plugin and connect your account by email OTP. Works with Hermes chat, Telegram, and WhatsApp sessions.',
};

const installSteps = [
  {
    text: 'Install the plugin into ~/.hermes/plugins/todo4/.',
    command: 'hermes plugins install https://github.com/panitw/todo4-hermes-plugin',
  },
  {
    text: 'Start a chat session so Hermes runs the plugin’s register() hook — this installs the bundled todo4-onboard and todo4-work skills into ~/.hermes/skills/. You can exit immediately.',
    command: 'hermes chat        # then type /exit',
  },
  {
    text: 'Restart the gateway so Telegram/WhatsApp sessions pick up the new toolset. (Skip if you only use hermes chat locally.)',
    command: 'hermes gateway restart',
  },
] as const;

const onboardSteps = [
  'Start a Hermes chat session.',
  'Paste the prompt above into the chat.',
  'When asked, provide your email — todo4 sends a 6-digit verification code.',
  'Paste the code back into chat. The skill creates your account, connects this Hermes instance as your agent, and writes the MCP config automatically.',
  'Run `hermes gateway restart` (or `/reload-mcp`) so the todo4 MCP tools activate.',
] as const;

const verifySteps = [
  { command: 'hermes plugins list | grep todo4', note: 'enabled, v0.1.0, source=git' },
  { command: 'hermes skills list  | grep todo4', note: 'todo4-onboard + todo4-work, source=local' },
  { command: 'hermes tools list   | grep todo4', note: '✓ enabled  todo4  Todo4' },
] as const;

type TestItem = { text: string; suffix?: string };
const tests: readonly TestItem[] = [
  { text: '“List my todo4 tasks.”' },
  { text: '“Create a task to review the Q2 report by Friday, p2.”' },
  {
    text: '“Call todo4_status”',
    suffix: '— reports whether the agent token, MCP entry, and API reachability are all good.',
  },
];

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs text-white">{children}</code>
  );
}

export default function HermesConnectPage() {
  return (
    <article className="max-w-2xl">
      <header className="mb-6">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px] text-white/50">
          Connect your agent
        </div>
        <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-1px] md:text-[40px]">
          Hermes
        </h1>
        <p className="mt-3 text-base leading-relaxed text-white/70">
          Install the todo4 Hermes plugin, then connect your account by email OTP. Works with{' '}
          <InlineCode>hermes chat</InlineCode> and with gateway sessions (Telegram, WhatsApp). Takes
          about two minutes.
        </p>
      </header>

      <div
        role="note"
        className="mt-8 flex gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 text-sm"
      >
        <Info size={18} className="mt-0.5 shrink-0 text-amber-300" aria-hidden />
        <div className="text-amber-100">
          <strong className="font-semibold">Requires Hermes Agent</strong> with Python 3.9+ and a
          working <InlineCode>hermes</InlineCode> CLI. See the{' '}
          <a
            href="https://hermes-agent.nousresearch.com/docs/guides/build-a-hermes-plugin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-200 underline-offset-2 hover:underline"
          >
            Hermes plugin guide
          </a>{' '}
          for context on how plugins plug in.
        </div>
      </div>

      <section id="install" className="mt-12 scroll-mt-8">
        <div className="flex items-center gap-2 text-[#C4B8FF]">
          <Terminal size={20} aria-hidden />
          <h2 className="text-xl font-semibold text-white">Step 1 — Install the plugin</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Run these three commands in order. Step 2 matters:{' '}
          <InlineCode>hermes plugins install</InlineCode> does not run the plugin’s{' '}
          <InlineCode>register()</InlineCode> — only a chat session does. Without it the bundled
          skills never get copied into <InlineCode>~/.hermes/skills/</InlineCode>.
        </p>

        <ol className="mt-6 flex flex-col gap-5 text-sm leading-relaxed text-white/85">
          {installSteps.map((step, i) => (
            <li key={step.command}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6C4FE8] to-[#4F7FE5] text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p>{step.text}</p>
                  <div className="mt-2">
                    <DocsCommandBlock command={step.command} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-white">Verify the install</h3>
          <ul className="mt-3 flex flex-col gap-3 text-sm text-white/85">
            {verifySteps.map((v) => (
              <li key={v.command} className="flex flex-col gap-1">
                <DocsCommandBlock command={v.command} />
                <span className="pl-1 text-xs text-white/65">Expected: {v.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="onboard" className="mt-12 scroll-mt-8">
        <div className="flex items-center gap-2 text-[#C4B8FF]">
          <Sparkles size={20} aria-hidden />
          <h2 className="text-xl font-semibold text-white">Step 2 — Onboard via email OTP</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          Hermes doesn’t auto-match fuzzy phrases to skills reliably. Use this explicit prompt to
          run the onboarding flow:
        </p>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-white">Paste this in chat</p>
          <DocsCommandBlock command="Run the todo4-onboard skill" ariaLabel="Copy onboard prompt to clipboard" />
        </div>

        <ol className="mt-6 flex flex-col gap-3 text-sm leading-relaxed text-white/85">
          {onboardSteps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6C4FE8] to-[#4F7FE5] text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-xs text-white/65">
          Fallback prompt if the skill doesn’t trigger:{' '}
          <InlineCode>Use todo4_register to sign me up — my email is you@example.com</InlineCode>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">Test your connection</h2>
        <p className="mt-2 text-sm text-white/70">Back in Hermes, try one of these:</p>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-white/85">
          {tests.map((t) => (
            <li key={t.text} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
              <span>
                <em>{t.text}</em>
                {t.suffix && <span className="ml-1 text-xs text-white/65">{t.suffix}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <DocsCtaCard
        title="Don’t have a todo4 account yet?"
        body="The onboarding skill creates one for you via email OTP. Or sign up first if you prefer."
      />

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">Troubleshooting</h2>
        <div className="mt-4 flex flex-col gap-5 text-sm text-white/85">
          <div>
            <h3 className="font-semibold text-white">Skills don’t show up after install</h3>
            <p className="mt-1 text-white/65">
              Make sure you ran <InlineCode>hermes chat</InlineCode> at least once after install.
              The <InlineCode>register()</InlineCode> hook only fires when a chat session starts —
              that’s when bundled skills get copied into <InlineCode>~/.hermes/skills/</InlineCode>.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white">I never received the verification code</h3>
            <p className="mt-1 text-white/65">
              Check your spam folder. The skill rate-limits resends — if you hit the limit, wait a
              minute and ask the skill to send a new code.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white">MCP tools don’t appear after onboarding</h3>
            <p className="mt-1 text-white/65">
              Run <InlineCode>hermes gateway restart</InlineCode> (or{' '}
              <InlineCode>/reload-mcp</InlineCode> inside chat) so the new MCP server entry is
              picked up. Confirm with <InlineCode>hermes tools list | grep todo4</InlineCode>.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white">Updating the plugin</h3>
            <p className="mt-1 text-white/65">
              Hermes doesn’t currently pull plugin updates in place when the version in{' '}
              <InlineCode>plugin.yaml</InlineCode> hasn’t bumped. Uninstall + reinstall is the
              reliable path:
            </p>
            <div className="mt-2">
              <DocsCommandBlock
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
    </article>
  );
}
