import { useEffect, useLayoutEffect, useRef } from 'react';

export interface KeyboardShortcutActions {
  onCreateTask: () => void;
  onFocusSearch: () => void;
  onEditFocused: () => void;
  onToggleFocused: () => void;
  onSelectFocused: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onEditModeFocused: () => void;
  onEscape: () => void;
}

/**
 * Returns true if the keyboard event target is an interactive form element
 * where single-key shortcuts should NOT fire.
 */
function isInteractiveTarget(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  // Inside a dialog/sheet/command overlay — let the overlay handle its own keys
  if (target.closest('[data-slot="sheet-content"], [role="dialog"], [data-slot="command"]')) return true;
  return false;
}

/**
 * Centralized keyboard shortcut handler for the tasks page.
 *
 * Shortcuts:
 * - C: create task
 * - /: focus search
 * - E: edit focused task
 * - Space: toggle checkbox on focused task
 * - Enter: select focused task
 * - ArrowDown/Up: navigate task list
 * - F2: enter title edit mode
 * - Escape: clear focus / close panels
 *
 * All single-key shortcuts are suppressed when an INPUT, TEXTAREA, SELECT,
 * or contentEditable element is focused.
 */
export function useKeyboardShortcuts(
  actions: KeyboardShortcutActions,
  { enabled = true, taskCount = 0, focusedIndex = -1 }: { enabled?: boolean; taskCount?: number; focusedIndex?: number } = {},
) {
  // Use refs to avoid stale closures without re-registering the listener
  const actionsRef = useRef(actions);
  const enabledRef = useRef(enabled);
  const taskCountRef = useRef(taskCount);
  const focusedIndexRef = useRef(focusedIndex);

  useLayoutEffect(() => {
    actionsRef.current = actions;
    enabledRef.current = enabled;
    taskCountRef.current = taskCount;
    focusedIndexRef.current = focusedIndex;
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!enabledRef.current) return;

      // Cmd/Ctrl+K is handled at the layout level (command palette) — don't interfere
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') return;

      const interactive = isInteractiveTarget(e);

      // Single-key shortcuts only fire when NOT in an interactive element
      if (!interactive) {
        // C — create task
        if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          actionsRef.current.onCreateTask();
          return;
        }

        // / — focus search bar
        if (e.key === '/') {
          e.preventDefault();
          actionsRef.current.onFocusSearch();
          return;
        }

        // E — edit focused/selected task
        if ((e.key === 'e' || e.key === 'E') && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault();
          actionsRef.current.onEditFocused();
          return;
        }

        // Space — toggle checkbox on focused task
        // Only intercept on body/task-list to avoid hijacking buttons/links
        if (e.key === ' ') {
          const target = e.target as HTMLElement;
          const tag = target?.tagName;
          if (tag !== 'BODY' && !target?.closest('[role="list"]')) return;
          if (taskCountRef.current === 0) return;
          e.preventDefault();
          actionsRef.current.onToggleFocused();
          return;
        }

        // Arrow navigation
        if (e.key === 'ArrowDown') {
          if (taskCountRef.current === 0) return;
          if (focusedIndexRef.current < 0) return;
          e.preventDefault();
          actionsRef.current.onMoveDown();
          return;
        }

        if (e.key === 'ArrowUp') {
          if (taskCountRef.current === 0) return;
          if (focusedIndexRef.current < 0) return;
          e.preventDefault();
          actionsRef.current.onMoveUp();
          return;
        }

        // Enter — select focused task
        if (e.key === 'Enter') {
          if (taskCountRef.current === 0) return;
          if (focusedIndexRef.current < 0) return;
          e.preventDefault();
          actionsRef.current.onSelectFocused();
          return;
        }

        // F2 — enter title edit mode
        if (e.key === 'F2') {
          if (taskCountRef.current === 0) return;
          if (focusedIndexRef.current < 0) return;
          e.preventDefault();
          actionsRef.current.onEditModeFocused();
          return;
        }

        // Escape — clear focus / close panels
        if (e.key === 'Escape') {
          actionsRef.current.onEscape();
          return;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
