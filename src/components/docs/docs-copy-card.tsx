'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function DocsCopyCard({
  label,
  value,
  tone = 'field',
}: {
  label?: string;
  value: string;
  tone?: 'field' | 'code';
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied!');
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Unable to copy. Please copy manually.');
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border border-white/10 p-4',
        tone === 'code' ? 'bg-black/40' : 'bg-white/[0.03]',
      )}
    >
      {label && (
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-white/60">
          {label}
        </div>
      )}
      <pre className="pr-10 font-mono text-sm text-white break-all whitespace-pre-wrap">{value}</pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${label ?? 'value'} to clipboard`}
        className="absolute top-3 right-3 rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
