import { isAppleDevice } from "./utils";

function formatKeyToken(token: string): string {
  const trimmed = token.trim();
  const lower = trimmed.toLowerCase();

  if (lower === "ctrl" || lower === "cmd" || lower === "meta") {
    return isAppleDevice ? "⌘" : "CTRL";
  }
  if (lower === "shift") {
    return "⇧";
  }
  if (lower === "alt" || lower === "option") {
    return isAppleDevice ? "⌥" : "ALT";
  }
  if (lower === "arrowleft") {
    return "←";
  }
  if (lower === "arrowright") {
    return "→";
  }
  if (lower === "arrowup") {
    return "↑";
  }
  if (lower === "arrowdown") {
    return "↓";
  }
  if (lower === "escape" || lower === "esc") {
    return "ESC";
  }

  return trimmed.toUpperCase();
}

/**
 * Formats a keyboard shortcut string for display, using appropriate symbols for modifier keys
 * based on the user's operating system.
 *
 * Examples:
 * - "ctrl+k" -> "⌘ + K" (on macOS) or "CTRL + K" (on other OS)
 * - "shift+p" -> "⇧ + P"
 * - "shift+arrowLeft" -> "⇧ + ←"
 * - "alt+x" -> "⌥ + X" (on macOS) or "ALT + X" (on other OS)
 * - "g p" -> "G + P"
 * - "arrowDown" -> "↓"
 *
 * @param key The keyboard shortcut string (e.g., "ctrl+k", "shift+p", "shift+arrowLeft", "g p")
 * @returns Formatted string for display
 */
export function formatKeyboardShortcut(key: string): string {
  if (!key) {
    return "";
  }

  if (key.includes("+")) {
    // Modifier key combination (e.g., ctrl+k -> CTRL + K or ⌘ + K, shift+arrowLeft -> ⇧ + ←)
    return key.split("+").map(formatKeyToken).join(" + ");
  }

  if (key.includes(" ")) {
    // Space-separated keys (e.g., g p -> G + P)
    return key.split(" ").filter(Boolean).map(formatKeyToken).join(" + ");
  }

  // Single key (e.g., arrowDown -> ↓, escape -> ESC, a -> A)
  return formatKeyToken(key);
}

// Debounce map to prevent multiple rapid clicks
const clickDebounceMap = new Map<string, number>();

const INTERACTIVE_HOST_SELECTOR =
  "button, [role='button'], a, [data-shortcut-target]";

const OPEN_OVERLAY_SELECTOR = [
  "[role='dialog'][data-state='open']",
  "[role='alertdialog'][data-state='open']",
  "[data-radix-popper-content-wrapper] [data-state='open']",
].join(", ");

const MOUNTED_OVERLAY_SELECTOR = "[role='dialog'], [role='alertdialog']";

const DISABLED_HOST_SELECTOR =
  "[disabled], [aria-disabled='true'], [data-disabled]";

function isRenderedAndEnabled(host: HTMLElement): boolean {
  if (!host.isConnected || host.getClientRects().length === 0) {
    return false;
  }
  if ("disabled" in host && (host as { disabled?: boolean }).disabled) {
    return false;
  }
  return !host.matches(DISABLED_HOST_SELECTOR);
}

function resolveInteractiveHosts(shortcutId: string): HTMLElement[] {
  const badges = document.querySelectorAll(
    `[data-shortcut-id='${CSS.escape(shortcutId)}']`,
  );
  const hosts = new Set<HTMLElement>();

  badges.forEach((badge) => {
    const host = badge.closest(INTERACTIVE_HOST_SELECTOR) as HTMLElement | null;
    if (host && !hosts.has(host) && isRenderedAndEnabled(host)) {
      hosts.add(host);
    }
  });

  return [...hosts];
}

// Among enabled candidates, prefer the one inside the topmost (last-rendered) open overlay
function resolveBestHost(hosts: HTMLElement[]): HTMLElement | undefined {
  let lastInOverlay: HTMLElement | undefined;

  for (const host of hosts) {
    if (host.closest(OPEN_OVERLAY_SELECTOR)) {
      lastInOverlay = host;
    }
  }

  if (lastInOverlay) {
    return lastInOverlay;
  }

  if (document.querySelector(MOUNTED_OVERLAY_SELECTOR)) {
    return undefined;
  }

  return hosts[0];
}

export function shortcutActionHandler(shortcutId: string) {
  return () => {
    const now = Date.now();
    const lastClick = clickDebounceMap.get(shortcutId) || 0;

    // Debounce clicks within 300ms
    if (now - lastClick < 300) {
      return;
    }

    clickDebounceMap.set(shortcutId, now);

    const host = resolveBestHost(resolveInteractiveHosts(shortcutId));

    if (host) {
      host.click();
    }
  };
}
