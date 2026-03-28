'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopyablePromptBlockProps {
  prompt: string;
}

export function CopyablePromptBlock({ prompt }: CopyablePromptBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-left w-full max-w-md">
      <p className="flex-1 text-sm font-mono text-foreground/80 leading-relaxed">
        {prompt}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied' : `Copy prompt: ${prompt}`}
        className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {copied ? (
          <Check size={16} className="text-green-600" aria-hidden="true" />
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
