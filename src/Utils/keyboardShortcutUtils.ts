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

const INTERACTIVE_HOST_SELECTOR =
  "button, [role='button'], a, [data-shortcut-target]";

const OPEN_OVERLAY_SELECTOR = [
  "[role='dialog'][data-open]",
  "[role='alertdialog'][data-open]",
  "[role='dialog'][data-state='open']",
  "[role='alertdialog'][data-state='open']",
  "[data-radix-popper-content-wrapper] [data-state='open']",
].join(", ");

const MOUNTED_OVERLAY_SELECTOR = "[role='dialog'], [role='alertdialog']";

const COMMAND_DIALOG_SELECTOR = "[data-shortcut-command-dialog]";

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

// Only the topmost (last-rendered) open overlay can receive a shortcut. Actions
// chosen from the command dialog skip it and run against what's underneath.
function resolveBestHost(
  hosts: HTMLElement[],
  skipCommandDialog = false,
): HTMLElement | undefined {
  const isActiveOverlay = (overlay: Element) =>
    !skipCommandDialog || !overlay.querySelector(COMMAND_DIALOG_SELECTOR);

  const topOverlay = [...document.querySelectorAll(OPEN_OVERLAY_SELECTOR)]
    .filter(isActiveOverlay)
    .at(-1);

  if (topOverlay) {
    return hosts.filter((host) => topOverlay.contains(host)).at(-1);
  }

  const hasBlockingOverlay = [
    ...document.querySelectorAll(MOUNTED_OVERLAY_SELECTOR),
  ].some(isActiveOverlay);

  return hasBlockingOverlay ? undefined : hosts[0];
}

export function canRunFromCommandDialog(shortcutId: string) {
  return (
    resolveBestHost(resolveInteractiveHosts(shortcutId), true) !== undefined
  );
}

export function shortcutActionHandler(
  shortcutId: string,
  { fromCommandDialog = false }: { fromCommandDialog?: boolean } = {},
) {
  return () => {
    const now = Date.now();
    const lastClick = clickDebounceMap.get(shortcutId) || 0;

    // Debounce clicks within 300ms
    if (now - lastClick < 300) {
      return;
    }

    clickDebounceMap.set(shortcutId, now);

    const host = resolveBestHost(
      resolveInteractiveHosts(shortcutId),
      fromCommandDialog,
    );

    if (host) {
      host.click();
    }
  };
}
