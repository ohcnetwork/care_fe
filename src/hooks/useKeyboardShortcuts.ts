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
    const gPrefix: Record<string, KeyboardShortcut> = {};
    const qPrefix: Record<string, KeyboardShortcut> = {};
    const modified: Record<string, KeyboardShortcut> = {};

    shortcuts.forEach((shortcut) => {
      // Check if this shortcut should be active
      if (!evaluateWhenCondition(shortcut.when)) {
        return;
      }

      const key = shortcut.key.toLowerCase();

      if (key.startsWith("g ")) {
        // G-prefix shortcuts (like "g g", "g p")
        const gKey = key.substring(2);
        gPrefix[gKey] = shortcut;
      } else if (key.startsWith("q ")) {
        // Q-prefix shortcuts (like "q 0")
        const qKey = key.substring(2);
        qPrefix[qKey] = shortcut;
      } else if (key.includes("+")) {
        // Modified key shortcuts (like "ctrl+k", "shift+p")
        modified[key] = shortcut;
      } else {
        // Direct key shortcuts (like "a", "s", "d")
        direct[key] = shortcut;
      }
    });

    return { direct, gPrefix, qPrefix, modified };
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

  const gPrefixActiveRef = useRef(false);
  const qPrefixActiveRef = useRef(false);

  const [gPrefixActive, setGPrefixActive] = useState(false);
  const [qPrefixActive, setQPrefixActive] = useState(false);

  // Reset prefix states after timeout
  useEffect(() => {
    if (gPrefixActive) {
      const timer = setTimeout(() => {
        gPrefixActiveRef.current = false;
        setGPrefixActive(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gPrefixActive]);

  useEffect(() => {
    if (qPrefixActive) {
      const timer = setTimeout(() => {
        qPrefixActiveRef.current = false;
        setQPrefixActive(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [qPrefixActive]);

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
      if (gPrefixActiveRef.current) {
        const shortcut = categorizedShortcuts.gPrefix[key];
        if (shortcut) {
          const handler = handlers[shortcut.action];
          if (handler) {
            event.preventDefault();
            event.stopPropagation();
            handler();
          }
        }
        gPrefixActiveRef.current = false;
        setGPrefixActive(false);
        return;
      }

      if (qPrefixActiveRef.current) {
        const shortcut = categorizedShortcuts.qPrefix[key];
        if (shortcut) {
          const handler = handlers[shortcut.action];
          if (handler) {
            event.preventDefault();
            event.stopPropagation();
            handler();
          }
        } else {
          // Handle Q + 1-9 for dynamic questionnaires
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
        qPrefixActiveRef.current = false;
        setQPrefixActive(false);
        return;
      }

      // Handle direct keys and prefix initiators
      if (key === "g") {
        gPrefixActiveRef.current = true;
        setGPrefixActive(true);
        event.preventDefault();
        return;
      }

      if (key === "q") {
        qPrefixActiveRef.current = true;
        setQPrefixActive(true);
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
    gPrefixActive,
    qPrefixActive,
  };
}
