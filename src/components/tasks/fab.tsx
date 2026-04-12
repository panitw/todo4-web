'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn, primeMobileKeyboardFocus } from '@/lib/utils';

const emptySubscribe = () => () => {};

interface FabProps {
  onClick: () => void;
}

export function Fab({ onClick }: FabProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function handleResize() {
      const threshold = window.innerHeight * 0.75;
      setIsKeyboardOpen((viewport?.height ?? window.innerHeight) < threshold);
    }

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted || isKeyboardOpen) return null;

  function handleClick() {
    primeMobileKeyboardFocus();
    onClick();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Create new task"
      className={cn(
        buttonVariants({ variant: 'gradient' }),
        'fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-4 z-40 size-14 rounded-full shadow-lg active:scale-95 md:hidden',
      )}
    >
      <Plus className="size-6" />
    </button>
  );
}
