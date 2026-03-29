'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

interface FabProps {
  onClick: () => void;
}

export function Fab({ onClick }: FabProps) {
  const [mounted, setMounted] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

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

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Create new task"
      className="md:hidden fixed bottom-[72px] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 active:scale-95 transition-all hover:opacity-85"
      style={{ backgroundImage: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
