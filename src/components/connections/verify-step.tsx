'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, Sparkles, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { type Platform, PLATFORMS } from './platform-card'
import { listAgents } from '@/lib/api/agents'

type TestState = 'idle' | 'testing' | 'success' | 'failure'

interface VerifyStepProps {
  platform: Platform
  onBack: () => void
  onDone?: () => void
}

export function VerifyStep({ platform, onBack, onDone }: VerifyStepProps) {
  const info = PLATFORMS[platform]
  const [testState, setTestState] = useState<TestState>('idle')

  const testConnection = useCallback(async () => {
    setTestState('testing')
    try {
      // A successful fetch proves the API is reachable and the user is authenticated.
      // The agents list may be empty if the OAuth handshake hasn't completed yet.
      await listAgents()
      setTestState('success')
    } catch {
      setTestState('failure')
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Back to connect"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <h2 className="text-lg font-semibold">Verify Connection</h2>
      </div>

      {/* Live region for connection status announcements */}
      <div aria-live="assertive" className="sr-only">
        {testState === 'testing' && 'Testing connection…'}
        {testState === 'success' && 'Connection verified successfully.'}
        {testState === 'failure' && 'Connection test failed. Please try again.'}
      </div>

      {/* Connection test section */}
      <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
        {testState === 'idle' && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              After setting up {info.name}, test to make sure it can connect to
              todo4.
            </p>
            <Button variant="default" onClick={testConnection}>
              Test Connection
            </Button>
          </>
        )}

        {testState === 'testing' && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Testing connection…
            </p>
          </div>
        )}

        {testState === 'success' && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="size-8 text-green-500" />
            <p className="text-sm font-medium text-green-600">Connected!</p>
          </div>
        )}

        {testState === 'failure' && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="size-8 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              Connection failed
            </p>
            <p className="text-xs text-muted-foreground">
              Make sure you completed the setup steps and authorized todo4 in
              your browser.
            </p>
            <Button variant="outline" size="sm" onClick={testConnection}>
              Try again
            </Button>
          </div>
        )}
      </div>

      {/* Magic moment prompt (shown after success) */}
      {testState === 'success' && (
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
            If everything is set up correctly, the task will appear in your Tasks
            view within seconds.
          </p>
        </div>
      )}

      {/* Primary CTA */}
      {testState === 'success' ? (
        <Link
          href="/tasks"
          className={cn(buttonVariants({ variant: 'gradient' }), 'w-full')}
        >
          Go to Tasks
        </Link>
      ) : (
        <Button
          variant="gradient"
          className="w-full"
          onClick={onDone}
        >
          Go to Connections
        </Button>
      )}
    </div>
  )
}
