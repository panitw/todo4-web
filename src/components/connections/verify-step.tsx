'use client'

import Link from 'next/link'
import { ChevronLeft, Sparkles, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { type Platform, PLATFORMS } from './platform-card'

interface VerifyStepProps {
  platform: Platform
  onBack: () => void
}

export function VerifyStep({ platform, onBack }: VerifyStepProps) {
  const info = PLATFORMS[platform]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Back to configuration"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <h2 className="text-lg font-semibold">Verify Connection</h2>
      </div>

      {/* Live region for future connection status */}
      <div aria-live="assertive" className="sr-only" />

      {/* Magic moment prompt */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-6 text-primary" />
        </div>
        <h3 className="mb-2 text-base font-semibold">Now try it!</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Ask your AI agent:
        </p>
        <div className="mx-auto max-w-sm rounded-md border border-border bg-background px-4 py-3 font-mono text-sm">
          Create a task called &quot;Hello from {info.name}&quot;
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          If everything is set up correctly, the task will appear in your Tasks view within seconds.
        </p>
      </div>

      {/* Primary CTA */}
      <Link
        href="/tasks"
        className={cn(buttonVariants({ variant: 'gradient' }), 'w-full')}
      >
        Go to Tasks
      </Link>

      {/* Coming soon info box */}
      <div className="flex gap-3 rounded-lg border border-border bg-muted/50 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          The backend for agent OAuth registration is under development. Once available, this step
          will automatically verify your connection.
        </p>
      </div>
    </div>
  )
}
