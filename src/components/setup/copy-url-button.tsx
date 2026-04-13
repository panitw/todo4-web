'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CopyUrlButtonProps {
  value: string;
  label: string;
}

export function CopyUrlButton({ value, label }: CopyUrlButtonProps) {
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
      await navigator.clipboard.writeText(value);
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
  }, [value]);

  return (
    <div className="relative rounded-lg border border-border bg-muted/50 p-4">
      <div className="pr-10">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-sm font-medium">
          {value}
        </pre>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={copy}
        className="absolute right-3 top-3"
        aria-label={`Copy ${label.toLowerCase()} to clipboard`}
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
