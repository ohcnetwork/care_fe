import { useMemo } from "react";

import shortcutsConfig from "@/config/keyboardShortcuts.json";

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
    return key.toUpperCase();
  }
}

type ShortcutContext = keyof typeof shortcutsConfig;

interface ShortcutConfig {
  key: string;
  action: string;
}

/**
 * Generic hook to get shortcut display strings for any context
 *
 * @param contexts Optional array of contexts to search for shortcuts. If not provided, searches all contexts.
 * @param dynamicResolver Optional function to resolve dynamic shortcuts (e.g., questionnaires)
 * @returns Function to get display string for an action ID
 */
export function useShortcutDisplays(
  contexts?: ShortcutContext[],
  dynamicResolver?: (actionId: string) => string | undefined,
) {
  return useMemo(() => {
    const getDisplay = (actionId: string): string | undefined => {
      const searchContexts =
        contexts || (Object.keys(shortcutsConfig) as ShortcutContext[]);

      for (const context of searchContexts) {
        const shortcuts = shortcutsConfig[context] as ShortcutConfig[];
        const shortcut = shortcuts.find((s) => s.action === actionId);

        if (shortcut) {
          return formatKeyboardShortcut(shortcut.key);
        }
      }

      if (dynamicResolver) {
        return dynamicResolver(actionId);
      }

      return undefined;
    };

    return getDisplay;
  }, [contexts, dynamicResolver]);
}

export function shortcutActionHandler(shortcutId: string) {
  return () => {
    const element = document.querySelector(
      `[data-shortcut-id='${shortcutId}']`,
    ) as HTMLElement;

    if (element) {
      if (element.tagName === "A" && "href" in element) {
        window.location.href = (element as HTMLAnchorElement).href;
      } else {
        element.click();
      }
    }
  };
}

export function shortcutActionHandlers(shortcutIds: string[]) {
  return shortcutIds.map((id) => ({
    id,
    handler: shortcutActionHandler(id),
  }));
}
