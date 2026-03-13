import { isAppleDevice } from "./utils";

/**
 * Formats a keyboard shortcut string for display, using appropriate symbols for modifier keys
 * based on the user's operating system.
 *
 * Examples:
 * - "ctrl+k" -> "⌘ + K" (on macOS) or "CTRL + K" (on other OS)
 * - "shift+p" -> "⇧ + P"
 * - "alt+x" -> "⌥ + X" (on macOS) or "ALT + X" (on other OS)
 * - "g p" -> "G + P"
 *
 * @param key The keyboard shortcut string (e.g., "ctrl+k", "shift+p", "g p")
 * @returns Formatted string for display
 */
export function formatKeyboardShortcut(key: string): string {
  if (key.includes("+")) {
    // Modifier key combination (ctrl+k -> CTRL + K or ⌘ + K)
    const parts = key.split("+");
    return parts
      .map((k) => {
        const lower = k.toLowerCase();
        if (lower === "ctrl" || lower === "cmd" || lower === "meta") {
          return isAppleDevice ? "⌘" : "CTRL";
        }
        if (lower === "shift") {
          return "⇧";
        }
        if (lower === "alt") {
          return isAppleDevice ? "⌥" : "ALT";
        }
        return k.toUpperCase();
      })
      .join(" + ");
  } else if (key.includes(" ")) {
    // Space-separated keys (g p -> G + P)
    return key
      .split(" ")
      .map((k) => k.toUpperCase())
      .join(" + ");
  } else {
    // Single key (a -> A)
    if (key === "arrowDown") {
      return "↓";
    }
    if (key === "escape") {
      return "ESC";
    } else if (key === "arrowLeft") {
      return "←";
    }
    return key.toUpperCase();
  }
}

// Debounce map to prevent multiple rapid clicks
const clickDebounceMap = new Map<string, number>();

export function shortcutActionHandler(shortcutId: string) {
  return () => {
    const now = Date.now();
    const lastClick = clickDebounceMap.get(shortcutId) || 0;

    // Debounce clicks within 300ms
    if (now - lastClick < 300) {
      return;
    }

    clickDebounceMap.set(shortcutId, now);

    const element = document.querySelector(
      `[data-shortcut-id='${shortcutId}']`,
    ) as HTMLElement;

    if (element) {
      element.click();
    }
  };
}
