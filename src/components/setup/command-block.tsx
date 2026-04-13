'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommandBlockProps {
  command: string;
  ariaLabel?: string;
}

export function CommandBlock({ command, ariaLabel }: CommandBlockProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      if (liveRef.current) liveRef.current.textContent = 'Copied to clipboard';
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopied(false);
        if (liveRef.current) liveRef.current.textContent = '';
      }, 2000);
    } catch {
      if (liveRef.current)
        liveRef.current.textContent =
          'Failed to copy — please select and copy manually';
    }
  }, [command]);

  return (
    <div className="relative rounded-md bg-zinc-900 p-3 pr-12 dark:bg-zinc-950">
      <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs text-zinc-100">
        {command}
      </pre>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={copy}
        className="absolute right-2 top-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        aria-label={ariaLabel ?? 'Copy command to clipboard'}
      >
        {copied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Copy className="size-4" />
        )}
      </Button>
      <div ref={liveRef} aria-live="polite" className="sr-only" />
    </div>
  );
}
