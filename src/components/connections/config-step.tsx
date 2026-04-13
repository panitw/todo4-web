'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronLeft, Copy, Check, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type Platform, PLATFORMS } from './platform-card'

const MCP_URL = process.env.NEXT_PUBLIC_MCP_URL || 'https://todo4.io/mcp'

interface Step {
  text: string
  code?: string
}

interface PlatformConfig {
  /** Whether to show the copy box at the top (GUI platforms only) */
  showCopyBox: boolean
  /** The primary value to copy (URL or command) */
  copyValue: string
  /** Label shown above the copy box */
  copyLabel: string
  /** Ordered setup steps */
  steps: Step[]
  note?: string
  /** Prominent warning banner shown above the copy box */
  warning?: { title: string; body: string }
}

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  claude: {
    showCopyBox: true,
    copyValue: MCP_URL,
    copyLabel: 'MCP Server URL',
    steps: [
      { text: 'Open Claude (Desktop or Web) and click the Customize icon in the sidebar' },
      { text: 'Select "Connectors"' },
      { text: 'Click "Add custom connector"' },
      { text: 'Enter "Todo4" as the name and paste the URL above' },
      { text: 'Click "Add" and authorize todo4 when your browser opens' },
    ],
  },
  chatgpt: {
    showCopyBox: true,
    copyValue: MCP_URL,
    copyLabel: 'MCP Server URL',
    warning: {
      title: 'ChatGPT support is experimental and not reliable',
      body: 'Custom MCP servers only work in ChatGPT Developer mode today, and we have seen the connector fail to invoke tools or stay authorized across sessions. Try at your own risk \u2014 if you want a stable experience, use Claude, Gemini, or OpenClaw instead.',
    },
    steps: [
      { text: 'Open ChatGPT \u2192 Settings \u2192 Apps & Connectors \u2192 Advanced settings' },
      { text: 'Toggle on Developer mode (Elevated risk) and click "Create app"' },
      { text: 'Enter "Todo4" as the name and paste the URL above as the MCP Server URL' },
      { text: 'Leave Authentication as OAuth, check "I understand and want to continue", then click "Create"' },
      { text: 'Authorize todo4 when your browser opens' },
    ],
    note: 'Developer Mode is in beta for Pro, Plus, Business, Enterprise, and Education plans.',
  },
  gemini: {
    showCopyBox: false,
    copyValue: `gemini mcp add todo4 --url ${MCP_URL} --auth oauth`,
    copyLabel: 'Terminal Command',
    steps: [
      { text: 'Install Node.js 20+ from nodejs.org (if not installed)' },
      { text: 'Install Gemini CLI', code: 'npm install -g @google/gemini-cli' },
      { text: 'Add todo4 to Gemini CLI', code: `gemini mcp add todo4 --url ${MCP_URL} --auth oauth` },
      { text: 'Authorize todo4 when your browser opens' },
    ],
    note: 'The consumer Gemini web app does not yet support custom MCP servers.',
  },
  openclaw: {
    showCopyBox: false,
    copyValue: `mcporter config add todo4 --url ${MCP_URL} --scope home --auth oauth\nmcporter auth todo4`,
    copyLabel: 'Terminal Commands',
    steps: [
      { text: 'Install OpenClaw from github.com/openclaw/openclaw' },
      { text: 'Install MCPorter', code: 'npm install -g mcporter' },
      { text: 'Add todo4 to MCPorter', code: `mcporter config add todo4 --url ${MCP_URL} --scope home --auth oauth` },
      { text: 'Authenticate with todo4', code: 'mcporter auth todo4' },
      { text: 'Authorize todo4 when your browser opens' },
      { text: 'Restart OpenClaw', code: 'openclaw gateway restart' },
    ],
  },
}

function useCopyToClipboard(liveRef?: React.RefObject<HTMLDivElement | null>) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (liveRef?.current) liveRef.current.textContent = 'Copied to clipboard'
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCopied(false)
        if (liveRef?.current) liveRef.current.textContent = ''
      }, 2000)
    } catch {
      if (liveRef?.current) liveRef.current.textContent = 'Failed to copy — please select and copy manually'
    }
  }, [liveRef])

  return { copied, copy }
}

function CodeSnippet({ code, liveRef }: { code: string; liveRef: React.RefObject<HTMLDivElement | null> }) {
  const { copied, copy } = useCopyToClipboard(liveRef)

  return (
    <div className="group/code relative mt-1 ml-5">
      <code className="block rounded-md bg-muted px-3 py-1.5 pr-9 font-mono text-xs text-foreground">
        {code}
      </code>
      <button
        type="button"
        onClick={() => copy(code)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground transition-opacity hover:text-foreground md:opacity-0 md:group-hover/code:opacity-100"
        aria-label="Copy command"
      >
        {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
      </button>
    </div>
  )
}

interface ConfigStepProps {
  platform: Platform
  onBack: () => void
  onNext: () => void
}

export function ConfigStep({ platform, onBack, onNext }: ConfigStepProps) {
  const liveRef = useRef<HTMLDivElement>(null)
  const { copied, copy } = useCopyToClipboard(liveRef)
  const config = PLATFORM_CONFIGS[platform]
  const info = PLATFORMS[platform]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Back to platform selection"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <h2 className="text-lg font-semibold">Connect {info.name}</h2>
      </div>

      {/* Live region for copy announcements (shared with CodeSnippets) */}
      <div ref={liveRef} aria-live="polite" className="sr-only" />

      {config.warning && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4"
        >
          <TriangleAlert className="size-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="text-sm">
            <div className="font-semibold text-amber-900 dark:text-amber-200">{config.warning.title}</div>
            <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">{config.warning.body}</p>
          </div>
        </div>
      )}

      {/* Copy box — GUI platforms only */}
      {config.showCopyBox && (
        <div className="relative rounded-lg border border-border bg-muted/50 p-4">
          <div className="pr-10">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {config.copyLabel}
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm font-medium">
              {config.copyValue}
            </pre>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => copy(config.copyValue)}
            className="absolute right-3 top-3"
            aria-label={`Copy ${config.copyLabel.toLowerCase()} to clipboard`}
          >
            {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
          </Button>
        </div>
      )}

      {/* Steps */}
      <ol className="list-inside list-decimal space-y-3 text-sm text-muted-foreground">
        {config.steps.map((step, i) => (
          <li key={i}>
            {step.text}
            {step.code && (
              <CodeSnippet code={step.code} liveRef={liveRef} />
            )}
          </li>
        ))}
      </ol>

      {config.note && (
        <p className="text-xs text-muted-foreground italic">{config.note}</p>
      )}

      <Button variant="gradient" onClick={onNext} className="w-full">
        I&apos;ve configured my agent
      </Button>
    </div>
  )
}
