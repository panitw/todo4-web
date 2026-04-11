'use client';

import React, { useSyncExternalStore } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface ThreeColumnShellProps {
  leftNav: React.ReactNode;
  middle: React.ReactNode;
  right?: React.ReactNode;
  /** Controls whether the right panel Sheet is open (used on md breakpoint) */
  isRightPanelOpen?: boolean;
  /** Callback when Sheet open state changes (md breakpoint) */
  onRightPanelOpenChange?: (open: boolean) => void;
  /** Accessible label for the right panel Sheet */
  sheetTitle?: string;
}

// Subscribe/snapshot helpers defined outside the hook so they are stable
// across renders (no new function identity on each call).
function subscribeResize(cb: () => void) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}
function getWindowWidth() {
  return window.innerWidth;
}
function getServerWidth() {
  // SSR-safe default — matches initial client render to avoid hydration mismatch.
  return 1280;
}

function useBreakpoint() {
  const width = useSyncExternalStore(subscribeResize, getWindowWidth, getServerWidth);
  return {
    // < 640px: single-column (UX-DR2)
    isMobile: width < 640,
    // 640–899px: Sheet slide-over for right panel (UX-DR2)
    isMd: width >= 640 && width < 900,
    // ≥ 900px: full three-column inline (UX-DR1)
    isLg: width >= 900,
  };
}

export function ThreeColumnShell({
  leftNav,
  middle,
  right,
  isRightPanelOpen = false,
  onRightPanelOpenChange,
  sheetTitle = 'Details',
}: ThreeColumnShellProps) {
  const { isMobile, isMd, isLg } = useBreakpoint();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left nav: 180px on lg, 48px icon rail on md, hidden on mobile (<768px) */}
      {!isMobile && (
        <aside
          className={
            isMd
              ? 'w-12 shrink-0 border-r border-border overflow-y-auto'
              : 'w-[180px] shrink-0 border-r border-border overflow-y-auto'
          }
        >
          {leftNav}
        </aside>
      )}

      {/* Middle column: full-width on mobile, 340px fixed on md+ */}
      <main
        className={
          isMobile
            ? 'flex-1 overflow-y-auto'
            : 'w-[340px] shrink-0 border-r border-border overflow-y-auto'
        }
      >
        {middle}
      </main>

      {/* Right panel: inline on lg (≥1024px) */}
      {isLg && right !== undefined && (
        <section className="flex-1 overflow-y-auto">{right}</section>
      )}

      {/* Right panel: Sheet slide-over on md (768–1023px) */}
      {isMd && right !== undefined && (
        <Sheet open={isRightPanelOpen} onOpenChange={onRightPanelOpenChange}>
          <SheetContent side="right" aria-label={sheetTitle}>
            <SheetHeader>
              <SheetTitle>{sheetTitle}</SheetTitle>
            </SheetHeader>
            {right}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
