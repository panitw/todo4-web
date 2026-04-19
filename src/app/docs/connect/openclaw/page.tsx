import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CheckCircle2, Plug, Sparkles, Terminal } from 'lucide-react';
import { DocsCommandBlock } from '@/components/docs/docs-command-block';
import { DocsCtaCard } from '@/components/docs/docs-cta-card';

const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || 'https://todo4.io/mcp';
const SKILL_PROMPT = 'Install and set me up with Todo4: https://github.com/panitw/todo4-onboard-skill';
const PLUGIN_SPEC = '@panitw/todo4-openclaw-plugin';

export const metadata: Metadata = {
  title: 'Connect todo4 to OpenClaw — todo4 docs',
  description:
    'Connect todo4 to OpenClaw three ways: paste an install prompt in chat, install the npm plugin, or wire it up manually with MCPorter.',
};

const skillSteps = [
  'Open OpenClaw on your machine.',
  'Paste the prompt above into a new chat.',
  'When asked, provide your email — todo4 sends a 6-digit verification code.',
  'Paste the code back into chat. OpenClaw connects itself automatically (account, MCP config, and agent token are all wired up for you).',
] as const;

type NumberedStep = { text: string; command?: string; note?: ReactNode };

const pluginSteps: readonly NumberedStep[] = [
  { text: 'Install the todo4 plugin from npm.', command: `openclaw plugins install ${PLUGIN_SPEC}` },
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
            <InlineCode>“Run the todo4-onboard skill”</InlineCode>
          </li>
          <li>
            <InlineCode>“Set me up with todo4”</InlineCode>
          </li>
          <li>
            <InlineCode>“Sign me up for todo4”</InlineCode>
          </li>
        </ul>
      </>
    ),
  },
] as const;

const mcporterSteps: readonly NumberedStep[] = [
  {
    text: 'Make sure OpenClaw is installed.',
    note: (
      <>
        See{' '}
        <a
          href="https://github.com/openclaw/openclaw"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#C4B8FF] underline-offset-2 hover:underline"
        >
          github.com/openclaw/openclaw
        </a>{' '}
        for installation instructions.
      </>
    ),
  },
  { text: 'Install MCPorter (Node.js 20+ required).', command: 'npm install -g mcporter' },
  { text: 'Add todo4 to MCPorter.', command: `mcporter config add todo4 --url ${MCP_URL} --scope home --auth oauth` },
  { text: 'Authenticate. A browser tab opens for todo4 sign-in — approve the request.', command: 'mcporter auth todo4' },
  { text: 'Restart the OpenClaw gateway so it picks up the new MCP server.', command: 'openclaw gateway restart' },
] as const;

const tests = [
  '“List my todo4 tasks.”',
  '“Create a task to review the Q2 report by Friday, p2.”',
  '“What’s on my plate this week?”',
] as const;

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs text-white">{children}</code>
  );
}

function MethodCard({
  id,
  icon,
  title,
  body,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <a
      href={`#${id}`}
      className="group rounded-lg border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#8876FF]/60 hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-2 text-[#C4B8FF]">
        {icon}
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-white/65">{body}</p>
    </a>
  );
}

function NumberedList({ items }: { items: readonly NumberedStep[] }) {
  return (
    <ol className="mt-6 flex flex-col gap-5 text-sm leading-relaxed text-white/85">
      {items.map((step, i) => (
        <li key={step.text}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6C4FE8] to-[#4F7FE5] text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <div className="flex-1">
              <p>{step.text}</p>
              {step.command && (
                <div className="mt-2">
                  <DocsCommandBlock command={step.command} />
                </div>
              )}
              {step.note && <div className="mt-2 text-xs text-white/65">{step.note}</div>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function OpenclawConnectPage() {
  return (
    <article className="max-w-2xl">
      <header className="mb-6">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px] text-white/50">
          Connect your agent
        </div>
        <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-1px] md:text-[40px]">
          OpenClaw
        </h1>
        <p className="mt-3 text-base leading-relaxed text-white/70">
          Three paths, same result: a chat-driven skill install, an npm plugin, or a manual wiring
          with MCPorter — pick whichever matches how you already work.
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <MethodCard
          id="method-skill"
          icon={<Sparkles size={18} aria-hidden />}
          title="Method 1 — Skill (recommended)"
          body="Paste a prompt in chat. Email OTP, no browser, no CLI. Best for first-time users."
        />
        <MethodCard
          id="method-plugin"
          icon={<Plug size={18} aria-hidden />}
          title="Method 2 — Plugin (npm)"
          body="Install an npm plugin that ships the onboarding tools and skill. Two commands, then chat."
        />
        <MethodCard
          id="method-mcporter"
          icon={<Terminal size={18} aria-hidden />}
          title="Method 3 — MCPorter (CLI)"
          body="Manual setup with terminal commands. Best if you already use MCPorter or want OAuth-only auth."
        />
      </section>

      <section id="method-skill" className="mt-12 scroll-mt-8">
        <div className="flex items-center gap-2 text-[#C4B8FF]">
          <Sparkles size={20} aria-hidden />
          <h2 className="text-xl font-semibold text-white">Method 1 — Install via Skill</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          OpenClaw fetches the <InlineCode>/todo4-onboard</InlineCode> skill from GitHub and runs
          it. The skill creates your todo4 account via email OTP, then writes the MCP config and
          agent token automatically. No browser tab, no token paste.
        </p>

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-white">Paste this in chat</p>
          <DocsCommandBlock command={SKILL_PROMPT} ariaLabel="Copy install prompt to clipboard" />
        </div>

        <ol className="mt-6 flex flex-col gap-3 text-sm leading-relaxed text-white/85">
          {skillSteps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6C4FE8] to-[#4F7FE5] text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-xs text-white/65">
          Already installed the skill on a previous OpenClaw session? Just say{' '}
          <InlineCode>“Set me up with todo4”</InlineCode>.
        </p>
      </section>

      <section id="method-plugin" className="mt-12 scroll-mt-8">
        <div className="flex items-center gap-2 text-[#C4B8FF]">
          <Plug size={20} aria-hidden />
          <h2 className="text-xl font-semibold text-white">Method 2 — Install via Plugin</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          The plugin <InlineCode>{PLUGIN_SPEC}</InlineCode> registers four todo4 agent tools and
          installs a <InlineCode>todo4-onboard</InlineCode> skill into{' '}
          <InlineCode>~/.openclaw/skills/</InlineCode>. After you restart the gateway, just ask the
          agent to onboard you in chat.
        </p>
        <NumberedList items={pluginSteps} />
      </section>

      <section id="method-mcporter" className="mt-12 scroll-mt-8">
        <div className="flex items-center gap-2 text-[#C4B8FF]">
          <Terminal size={20} aria-hidden />
          <h2 className="text-xl font-semibold text-white">Method 3 — Install via MCPorter</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          For users who prefer terminal-based MCP server management. Uses standard OAuth
          (browser-based sign-in) instead of email OTP.
        </p>
        <NumberedList items={mcporterSteps} />
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">Test your connection</h2>
        <p className="mt-2 text-sm text-white/70">Back in OpenClaw, try one of these:</p>
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
        body="Method 1 creates one for you via email OTP. Or sign up first if you prefer."
      />

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white">Troubleshooting</h2>
        <div className="mt-4 flex flex-col gap-5 text-sm text-white/85">
          <div>
            <h3 className="font-semibold text-white">The skill doesn’t install or run</h3>
            <p className="mt-1 text-white/65">
              Make sure your OpenClaw version supports remote skill install from GitHub. If not,
              upgrade to the latest release or fall back to Method 2.
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
            <h3 className="font-semibold text-white">MCPorter says “todo4 already exists”</h3>
            <p className="mt-1 text-white/65">
              You’ve already added the connector. Run{' '}
              <InlineCode>mcporter auth todo4</InlineCode> to refresh authentication, or remove it
              first with <InlineCode>mcporter config remove todo4</InlineCode>.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white">Tools don’t show up after install</h3>
            <p className="mt-1 text-white/65">
              Make sure you ran <InlineCode>openclaw gateway restart</InlineCode> so OpenClaw picks
              up the new MCP server.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
