import React from 'react';

interface ThreeColumnShellProps {
  leftNav: React.ReactNode;
  middle: React.ReactNode;
  right?: React.ReactNode;
}

export function ThreeColumnShell({ leftNav, middle, right }: ThreeColumnShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left nav: 180px fixed */}
      <aside className="w-[180px] shrink-0 border-r border-border overflow-y-auto">
        {leftNav}
      </aside>

      {/* Middle column: 340px scrollable */}
      <main className="w-[340px] shrink-0 border-r border-border overflow-y-auto">
        {middle}
      </main>

      {/* Right panel: flex-1 */}
      {right !== undefined && (
        <section className="flex-1 overflow-y-auto">
          {right}
        </section>
      )}
    </div>
  );
}
