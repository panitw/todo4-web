'use client'

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRevokeAgent } from '@/hooks/use-revoke-agent'
import type { Agent } from '@/lib/api/agents'

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  if (!Number.isFinite(diff) || diff < 0) return 'Active just now'
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Active just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Active ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Active ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Active ${days}d ago`
  return `Active ${Math.floor(days / 30)}mo ago`
}

function ScopeBadge({ scope }: { scope: Agent['scope'] }) {
  const isFullAccess = scope === 'full-access'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
        isFullAccess
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {isFullAccess ? 'Full access' : 'Read only'}
    </span>
  )
}

function AgentRow({ agent }: { agent: Agent }) {
  const [open, setOpen] = useState(false)
  const revokeMutation = useRevokeAgent()

  return (
    <li className="flex items-center justify-between border rounded-lg px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
          <Bot className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{agent.name}</span>
            <ScopeBadge scope={agent.scope} />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(agent.lastActiveAt)}
          </p>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={
            <Button
              variant="destructive"
              size="sm"
              disabled={revokeMutation.isPending}
            />
          }
        >
          Revoke
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke agent access?</AlertDialogTitle>
            <AlertDialogDescription>
              This agent will immediately lose access to your tasks. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revokeMutation.isPending}
              onClick={() => {
                revokeMutation.mutate(agent.id, {
                  onSettled: () => setOpen(false),
                })
              }}
            >
              {revokeMutation.isPending ? 'Revoking\u2026' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}

export function AgentList({ agents }: { agents: Agent[] }) {
  return (
    <ul className="space-y-3">
      {agents.map((agent) => (
        <AgentRow key={agent.id} agent={agent} />
      ))}
    </ul>
  )
}
