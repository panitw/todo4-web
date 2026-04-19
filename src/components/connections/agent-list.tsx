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
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${
        isFullAccess
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
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
    <li className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          <Bot className="size-[18px]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{agent.name}</span>
            <ScopeBadge scope={agent.scope} />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatRelativeTime(agent.lastActiveAt)}
          </p>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              disabled={revokeMutation.isPending}
              className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
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
