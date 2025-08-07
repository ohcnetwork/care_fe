import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import shortcutsConfig from "@/config/keyboardShortcuts.json";

export type ShortcutContext = "global" | "encounter" | "patient" | "facility";

export interface ShortcutConditions {
  readOnly?: boolean;
  canEdit?: boolean;
  canCreate?: boolean;
  questionnairesEnabled?: boolean;
  [key: string]: unknown; // Allow custom conditions
}

export interface ShortcutHandlers {
  [action: string]: () => void;
}

export interface KeyboardShortcut {
  key: string;
  action: string;
  description: string;
  when: string;
}

export function useKeyboardShortcuts(
  contexts: ShortcutContext[],
  conditions: ShortcutConditions,
  handlers: ShortcutHandlers,
) {
  // Get shortcuts for all specified contexts
  const shortcuts = useMemo(() => {
    const allShortcuts: KeyboardShortcut[] = [];

    contexts.forEach((context) => {
      const config = shortcutsConfig as Record<string, KeyboardShortcut[]>;
      const contextShortcuts = config[context];
      if (contextShortcuts) {
        allShortcuts.push(...contextShortcuts);
      }
    });

    return allShortcuts;
  }, [contexts]);

  const evaluateWhenCondition = useCallback(
    (whenClause: string): boolean => {
      if (whenClause === "always") return true;

      // Create evaluation context
      const evalContext = {
        canEdit: conditions.canEdit || false,
        canCreate: conditions.canCreate || false,
        readOnly: conditions.readOnly || false,
        questionnairesEnabled: conditions.questionnairesEnabled || false,
        ...conditions, // Allow custom conditions
      };

      try {
        // Simple expression evaluation for conditions like "canEdit && questionnairesEnabled"
        // Replace variable names with their values
        let expression = whenClause;
        Object.entries(evalContext).forEach(([key, value]) => {
          const regex = new RegExp(`\\b${key}\\b`, "g");
          expression = expression.replace(regex, String(value));
        });

        // Evaluate the boolean expression
        return new Function(`return ${expression}`)();
      } catch (error) {
        console.warn(
          `Failed to evaluate shortcut condition: ${whenClause}`,
          error,
        );
        return false;
      }
    },
    [conditions],
  );

  // Parse and categorize shortcuts
  const categorizedShortcuts = useMemo(() => {
    const direct: Record<string, KeyboardShortcut> = {};
    const prefixGroups: Record<string, Record<string, KeyboardShortcut>> = {};
    const modified: Record<string, KeyboardShortcut> = {};

    shortcuts.forEach((shortcut) => {
      // Check if this shortcut should be active
      if (!evaluateWhenCondition(shortcut.when)) {
        return;
      }

      const key = shortcut.key.toLowerCase();

      if (key.includes(" ")) {
        // Prefix shortcuts (like "g g", "q q", "e e")
        const parts = key.split(" ");
        if (parts.length === 2 && parts[0] === parts[1]) {
          const prefix = parts[0];
          const suffix = parts[1];

          if (!prefixGroups[prefix]) {
            prefixGroups[prefix] = {};
          }
          prefixGroups[prefix][suffix] = shortcut;
        }
      } else if (key.includes("+")) {
        // Modified key shortcuts (like "ctrl+k", "shift+p")
        modified[key] = shortcut;
      } else {
        // Direct key shortcuts (like "a", "s", "d")
        direct[key] = shortcut;
      }
    });

    return { direct, prefixGroups, modified };
  }, [shortcuts, evaluateWhenCondition]);

  // Helper function to check if event matches key combination
  const matchesKeyCombo = useCallback(
    (keyCombo: string, event: KeyboardEvent): boolean => {
      const parts = keyCombo.split("+");
      if (parts.length === 1) {
        // Simple key
        return event.key.toLowerCase() === parts[0].toLowerCase();
      }

      // Modifier + key combination
      const key = parts[parts.length - 1].toLowerCase();
      const modifiers = parts.slice(0, -1);

      if (event.key.toLowerCase() !== key) return false;

      return modifiers.every((mod) => {
        switch (mod.toLowerCase()) {
          case "shift":
            return event.shiftKey;
          case "ctrl":
            return event.ctrlKey;
          case "cmd":
          case "meta":
            return event.metaKey;
          case "alt":
            return event.altKey;
          default:
            return false;
        }
      });
    },
    [],
  );

  // Dynamic prefix state management
  const prefixActiveRef = useRef<string | null>(null);
  const [activePrefix, setActivePrefix] = useState<string | null>(null);

  // Reset prefix states after timeout
  useEffect(() => {
    if (activePrefix) {
      const timer = setTimeout(() => {
        prefixActiveRef.current = null;
        setActivePrefix(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [activePrefix]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if typing in input fields (unless explicitly allowed)
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      if (isInputField && !event.ctrlKey && !event.metaKey) {
        return;
      }

      const key = event.key.toLowerCase();

      // Handle modified key shortcuts first
      const modifiedShortcut = Object.entries(
        categorizedShortcuts.modified,
      ).find(([keyCombo]) => matchesKeyCombo(keyCombo, event));

      if (modifiedShortcut) {
        const [, shortcut] = modifiedShortcut;
        const handler = handlers[shortcut.action];
        if (handler) {
          event.preventDefault();
          event.stopPropagation();
          handler();
          return;
        }
      }

      // Handle prefix sequences using refs for reliable state
      if (prefixActiveRef.current) {
        const currentPrefix = prefixActiveRef.current;
        const prefixShortcuts =
          categorizedShortcuts.prefixGroups[currentPrefix];

        if (prefixShortcuts) {
          const shortcut = prefixShortcuts[key];
          if (shortcut) {
            const handler = handlers[shortcut.action];
            if (handler) {
              event.preventDefault();
              event.stopPropagation();
              handler();
            }
          } else {
            // Handle dynamic shortcuts for the current prefix
            // For example, if prefix is 'q', handle q + 1-9 for questionnaires
            if (currentPrefix === "q") {
              const keyNumber = parseInt(key);
              if (!isNaN(keyNumber) && keyNumber >= 1 && keyNumber <= 9) {
                // Get all questionnaire handlers
                const allQuestionnaireActions = Object.keys(handlers).filter(
                  (action) => action.startsWith("questionnaire-"),
                );

                const targetIndex = keyNumber - 1;
                if (targetIndex < allQuestionnaireActions.length) {
                  const targetAction = allQuestionnaireActions[targetIndex];
                  const handler = handlers[targetAction];
                  if (handler) {
                    event.preventDefault();
                    event.stopPropagation();
                    handler();
                  }
                }
              }
            }
          }
        }
        prefixActiveRef.current = null;
        setActivePrefix(null);
        return;
      }

      // Handle prefix initiators
      const availablePrefixes = Object.keys(categorizedShortcuts.prefixGroups);
      if (availablePrefixes.includes(key)) {
        prefixActiveRef.current = key;
        setActivePrefix(key);
        event.preventDefault();
        return;
      }

      // Handle direct shortcuts
      const directShortcut = categorizedShortcuts.direct[key];
      if (directShortcut) {
        const handler = handlers[directShortcut.action];
        if (handler) {
          event.preventDefault();
          event.stopPropagation();
          handler();
        }
      }
    },
    [categorizedShortcuts, handlers, matchesKeyCombo],
  );

  // Attach event listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Return available shortcuts for display
  return {
    shortcuts: shortcuts.filter((shortcut) =>
      evaluateWhenCondition(shortcut.when),
    ),
    activePrefix,
  };
}
