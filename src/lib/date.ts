/**
 * Convert a due-date string (date-only `YYYY-MM-DD` or full ISO timestamp)
 * to a `YYYY-MM-DD` key in the user's local timezone. This is the join key
 * for "which local day does this task belong to". Using the raw UTC prefix
 * (`dueDate.slice(0, 10)`) is wrong east of UTC — a task stored as
 * `2026-04-19T17:00:00Z` represents 2026-04-20 in Bangkok, and must group
 * with that day, not UTC Apr 19.
 */
export function toLocalDateKey(iso: string): string {
  const dateOnly = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
