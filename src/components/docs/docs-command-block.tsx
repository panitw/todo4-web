'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function DocsCommandBlock({ command, ariaLabel }: { command: string; ariaLabel?: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      toast.success('Copied!');
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Unable to copy. Please copy manually.');
    }
  };

  return (
    <div className="relative rounded-md border border-white/10 bg-black/40 p-3 pr-12">
      <pre className="overflow-x-auto font-mono text-xs text-white break-all whitespace-pre-wrap">
        {command}
      </pre>
      <button
        type="button"
        onClick={copy}
        aria-label={ariaLabel ?? 'Copy command to clipboard'}
        className="absolute top-2 right-2 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
