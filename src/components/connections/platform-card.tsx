'use client'

import { Bot, MessageSquare, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

function LobsterIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Claws */}
      <path d="M4.5 4C3 4 2 5.5 2 7s1.5 2.5 3 2.5" />
      <path d="M5 7H3.5" />
      <path d="M19.5 4C21 4 22 5.5 22 7s-1.5 2.5-3 2.5" />
      <path d="M19 7h1.5" />
      {/* Arms */}
      <path d="M5 9.5L8 12" />
      <path d="M19 9.5L16 12" />
      {/* Body */}
      <ellipse cx="12" cy="13" rx="4" ry="3" />
      {/* Tail segments */}
      <path d="M9 16c0 1.5 1.3 3 3 3s3-1.5 3-3" />
      <path d="M10 19l-1 2" />
      <path d="M14 19l1 2" />
      <path d="M12 19v2" />
      {/* Eyes */}
      <circle cx="10.5" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
      {/* Antennae */}
      <path d="M10 10L8 7" />
      <path d="M14 10L16 7" />
    </svg>
  )
}

export type Platform = 'claude' | 'chatgpt' | 'gemini' | 'openclaw'

interface PlatformInfo {
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const PLATFORMS: Record<Platform, PlatformInfo> = {
  claude: {
    name: 'Claude',
    description: 'MCP via Connectors',
    icon: Bot,
  },
  chatgpt: {
    name: 'ChatGPT',
    description: 'MCP via Apps & Connectors',
    icon: MessageSquare,
  },
  gemini: {
    name: 'Gemini',
    description: 'MCP via CLI',
    icon: Sparkles,
  },
  openclaw: {
    name: 'OpenClaw',
    description: 'MCP via MCPorter',
    icon: LobsterIcon,
  },
}

interface PlatformCardProps {
  platform: Platform
  selected: boolean
  disabled?: boolean
  onSelect: (platform: Platform) => void
}

export function PlatformCard({ platform, selected, disabled, onSelect }: PlatformCardProps) {
  const info = PLATFORMS[platform]
  const Icon = info.icon

  if (disabled) {
    return (
      <div
        role="button"
        aria-disabled="true"
        className={cn(
          'flex w-full items-center gap-4 rounded-lg border border-border bg-muted/50 p-4 opacity-60 cursor-not-allowed',
          'md:flex-col md:items-center md:justify-center md:gap-2 md:p-6 md:text-center',
        )}
        aria-label={`${info.name} — coming soon`}
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </div>
        <div>
          <div className="text-sm font-medium text-muted-foreground">{info.name}</div>
          <div className="text-xs text-muted-foreground/70">Coming soon</div>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(platform)}
      className={cn(
        'group/card flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all',
        'md:flex-col md:items-center md:justify-center md:gap-2 md:p-6 md:text-center',
        selected
          ? 'border-transparent bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10 ring-2 ring-violet-500/40'
          : 'border-border bg-background hover:border-violet-300 hover:bg-gradient-to-br hover:from-violet-500/5 hover:via-blue-500/5 hover:to-cyan-500/5 dark:hover:border-violet-500/40'
      )}
      aria-label={`Connect via ${info.name} — ${info.description}`}
      aria-pressed={selected}
    >
      <div className={cn(
        'flex size-12 shrink-0 items-center justify-center rounded-lg transition-colors',
        selected
          ? 'bg-gradient-to-br from-violet-500 to-blue-500 text-white'
          : 'bg-muted text-muted-foreground group-hover/card:bg-violet-100 group-hover/card:text-violet-500 dark:group-hover/card:bg-violet-500/20 dark:group-hover/card:text-violet-400'
      )}>
        <Icon className="size-6" />
      </div>
      <div>
        <div className={cn('text-sm font-medium', selected && 'text-foreground')}>{info.name}</div>
        <div className={cn('text-xs', selected ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground')}>{info.description}</div>
      </div>
    </button>
  )
}

export { PLATFORMS }
