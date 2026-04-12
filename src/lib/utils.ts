import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * iOS Safari / PWA only opens the virtual keyboard when an <input> is focused
 * synchronously inside a user gesture. When we open a dialog via state change,
 * the real input doesn't exist yet and any deferred focus() loses the gesture.
 * Call this at the top of a click handler: it focuses a throwaway off-screen
 * input so the keyboard opens immediately, and subsequent focus calls on the
 * real input (e.g. via base-ui's initialFocus) transfer the keyboard smoothly.
 */
export function primeMobileKeyboardFocus() {
  if (typeof document === 'undefined') return
  const bait = document.createElement('input')
  bait.type = 'text'
  bait.setAttribute('aria-hidden', 'true')
  bait.tabIndex = -1
  bait.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;font-size:16px;'
  document.body.appendChild(bait)
  bait.focus()
  setTimeout(() => bait.remove(), 500)
}
