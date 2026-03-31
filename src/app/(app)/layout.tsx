'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Plus, Search } from 'lucide-react';
import { MobileTopBar } from '@/components/layout/mobile-top-bar';
import { CommandPalette } from '@/components/command-palette';
import { useSearch } from '@/providers/search-provider';
import { useCreateTaskAction } from '@/providers/create-task-provider';

const DesktopSidebar = dynamic(
  () => import('@/components/layout/desktop-sidebar').then((m) => m.DesktopSidebar),
  { ssr: false },
);

const BottomTabBar = dynamic(
  () => import('@/components/layout/bottom-tab-bar').then((m) => m.BottomTabBar),
  { ssr: false },
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { query, setQuery, active: searchActive } = useSearch();
  const { active: createTaskActive, trigger: triggerCreateTask } = useCreateTaskAction();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Cmd+K / Ctrl+K to open command palette (desktop only)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    function handleKeyDown(e: KeyboardEvent) {
      if (!mq.matches) return; // Only fire on desktop (md breakpoint)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommandSelectTask = useCallback(
    (taskId: string) => {
      if (pathname !== '/tasks') {
        // SPA navigate to tasks page with task param — tasks page reads this on mount
        router.push(`/tasks?task=${taskId}`);
      } else {
        // Dispatch a custom event that the tasks page listens for
        window.dispatchEvent(
          new CustomEvent('command-palette:select-task', { detail: { taskId } }),
        );
      }
    },
    [pathname, router],
  );

  // Show search bar and create task button only on task-related pages
  const showTaskBar = pathname === '/tasks' || pathname.startsWith('/tasks/') || pathname === '/calendar';

  // Page title for non-task pages
  const pageTitle = pathname.startsWith('/connections') ? 'Connections'
    : pathname.startsWith('/settings') ? 'Settings'
    : '';

  // P-2: Reset scroll position on view switch (AC6)
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden below md (768px) */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col">
        <DesktopSidebar />
      </aside>

      {/* Content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar — visible below md */}
        <div className="md:hidden">
          <MobileTopBar />
        </div>

        {/* Main content — with bottom padding on mobile for tab bar */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[960px] h-full px-4 md:px-8 pb-14 md:pb-0">
            {/* Desktop top bar — inside 960px content area (IG-2) */}
            <header className="hidden md:flex items-center gap-4 py-3 border-b border-border">
              <div className="flex-1 relative">
                {showTaskBar ? (
                  <>
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      aria-label="Search tasks"
                      className="w-full rounded-md border border-input bg-background px-9 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                      value={searchActive ? query : ''}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setQuery('');
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      readOnly={!searchActive}
                    />
                  </>
                ) : (
                  <span className="text-page-title font-semibold">{pageTitle}</span>
                )}
              </div>
              {showTaskBar && createTaskActive && (
                <button
                  type="button"
                  onClick={triggerCreateTask}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-85 active:opacity-75 [background-image:linear-gradient(135deg,#7c3aed,#3b82f6)]"
                >
                  <Plus className="h-4 w-4" />
                  New Task
                </button>
              )}
              <button type="button" aria-label="Notifications" className="relative text-muted-foreground">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
                  0
                </span>
              </button>
              <div className="h-8 w-8 rounded-full bg-muted" aria-label="User avatar" />
            </header>

            {children}
          </div>
        </main>

        {/* Command palette (desktop only — triggered by Cmd+K) */}
        <div className="hidden md:block">
          <CommandPalette
            open={commandPaletteOpen}
            onOpenChange={setCommandPaletteOpen}
            onSelectTask={handleCommandSelectTask}
          />
        </div>

        {/* Mobile bottom tab bar — visible below md */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50">
          <BottomTabBar />
        </div>
      </div>
    </div>
  );
}
