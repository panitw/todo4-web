'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAgents } from '@/hooks/use-agents'
import { AgentList } from '@/components/connections/agent-list'
import { ConnectionWizard } from '@/components/connections/connection-wizard'

export default function ConnectionsPage() {
  const { data: agents, isLoading, isError } = useAgents()
  const hasAgents = agents && agents.length > 0
  const [showWizard, setShowWizard] = useState(false)

  // Show wizard when user has no agents, or when they click "Connect"
  if (showWizard || (!isLoading && !isError && !hasAgents)) {
    return <ConnectionWizard onDone={() => setShowWizard(false)} />
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 md:py-12">
      <div className="mb-6 flex items-center justify-between gap-3 md:mb-8">
        <div className="min-w-0">
          <h1 className="hidden text-page-title font-semibold text-zinc-900 md:block dark:text-zinc-100">Connections</h1>
          <p className="text-sm text-zinc-500 md:mt-1 dark:text-zinc-400">
            Manage your connected AI agents
          </p>
        </div>
        {hasAgents && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowWizard(true)}
          >
            <Plus className="size-4" data-icon="inline-start" />
            Connect
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12 text-sm text-muted-foreground">
          Loading agents…
        </div>
      )}

      {isError && (
        <div className="flex justify-center py-12 text-sm text-destructive">
          Failed to load agents. Please try again.
        </div>
      )}

      {!isLoading && !isError && hasAgents && <AgentList agents={agents} />}
    </div>
  )
}
