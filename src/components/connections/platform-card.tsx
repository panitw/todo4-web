'use client'

import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Platform = 'claude' | 'chatgpt' | 'gemini' | 'openclaw'

interface PlatformInfo {
  name: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  imageSrc?: string
}

const PLATFORMS: Record<Platform, PlatformInfo> = {
  claude: {
    name: 'Claude',
    description: 'MCP via Connectors',
    imageSrc: '/claude.svg',
  },
  chatgpt: {
    name: 'ChatGPT',
    description: 'MCP via Apps & Connectors',
    imageSrc: '/chatgpt.png',
  },
  gemini: {
    name: 'Gemini',
    description: 'MCP via CLI',
    icon: Sparkles,
  },
  openclaw: {
    name: 'OpenClaw',
    description: 'MCP via MCPorter',
    imageSrc: '/openclaw.webp',
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

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : () => onSelect(platform)}
      className={cn(
        'group/card flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all',
        'md:flex-col md:items-center md:justify-center md:gap-2 md:p-6 md:text-center',
        disabled && 'opacity-60 cursor-not-allowed border-border bg-muted/50',
        !disabled && selected && 'border-transparent bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10 ring-2 ring-violet-500/40',
        !disabled && !selected && 'border-border bg-background hover:border-violet-300 hover:bg-gradient-to-br hover:from-violet-500/5 hover:via-blue-500/5 hover:to-cyan-500/5 dark:hover:border-violet-500/40'
      )}
      aria-label={disabled ? `${info.name} — coming soon` : `Connect via ${info.name} — ${info.description}`}
      aria-pressed={disabled ? undefined : selected}
    >
      <div className={cn(
        'flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-colors',
        info.imageSrc && 'bg-transparent',
        !info.imageSrc && disabled && 'bg-muted text-muted-foreground',
        !info.imageSrc && !disabled && selected && 'bg-gradient-to-br from-violet-500 to-blue-500 text-white',
        !info.imageSrc && !disabled && !selected && 'bg-muted text-muted-foreground group-hover/card:bg-violet-100 group-hover/card:text-violet-500 dark:group-hover/card:bg-violet-500/20 dark:group-hover/card:text-violet-400'
      )}>
        {info.imageSrc ? (
          <Image
            src={info.imageSrc}
            alt={`${info.name} logo`}
            width={48}
            height={48}
            className="size-12 object-contain"
          />
        ) : Icon ? (
          <Icon className="size-6" />
        ) : null}
      </div>
      <div>
        <div className={cn('text-sm font-medium', disabled ? 'text-muted-foreground' : selected ? 'text-foreground' : '')}>{info.name}</div>
        <div className={cn('text-xs', disabled ? 'text-muted-foreground/70' : selected ? 'text-violet-600 dark:text-violet-400' : 'text-muted-foreground')}>
          {disabled ? 'Coming soon' : info.description}
        </div>
      </div>
    </button>
  )
}

export { PLATFORMS }
