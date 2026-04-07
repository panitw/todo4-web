'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface TaskChangedEvent {
  userId?: string;
  taskId?: string;
  action?: 'created' | 'updated' | 'closed' | 'deleted' | 'archived' | 'restored';
  actorType?: 'human' | 'agent';
  actorId?: string;
  timestamp?: string;
}

function parseTaskChangedEvent(data: string): TaskChangedEvent | null {
  try {
    const parsed = JSON.parse(data) as TaskChangedEvent;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function useTaskEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof globalThis.EventSource === 'undefined') {
      return;
    }

    let es: EventSource;
    try {
      es = new EventSource('/api/v1/events/stream', {
        withCredentials: true,
      });
    } catch {
      return;
    }

    const onTaskChanged = (e: MessageEvent) => {
      const payload = parseTaskChangedEvent(e.data);
      if (!payload) return;

      // Invalidate all task list queries (partial match covers ['tasks', filters]
      // AND ['tasks', { attention: true }])
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      // Invalidate specific task detail if a panel is open
      if (typeof payload.taskId === 'string' && payload.taskId.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['task', payload.taskId] });
      }
    };

    es.addEventListener('task.changed', onTaskChanged);

    return () => {
      es.removeEventListener('task.changed', onTaskChanged);
      es.close();
    };
  }, [queryClient]);
}
