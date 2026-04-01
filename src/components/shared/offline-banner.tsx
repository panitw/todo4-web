'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true; // Assume online during SSR
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribeOnlineStatus, getOnlineSnapshot, getServerSnapshot);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>You&apos;re offline &mdash; changes will sync when you reconnect</span>
    </div>
  );
}
