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
  subContext?: string;
}

export function useKeyboardShortcuts(
  contexts: ShortcutContext[],
  conditions: ShortcutConditions,
  handlers: ShortcutHandlers,
  activeSubContext?: string,
  ignoreInputFields?: boolean,
) {
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

      const evalContext = {
        canEdit: conditions.canEdit || false,
        canCreate: conditions.canCreate || false,
        readOnly: conditions.readOnly || false,
        questionnairesEnabled: conditions.questionnairesEnabled || false,
        ...conditions, // Allow custom conditions
      };

      try {
        let expression = whenClause;
        Object.entries(evalContext).forEach(([key, value]) => {
          const regex = new RegExp(`\\b${key}\\b`, "g");
          expression = expression.replace(regex, String(value));
        });

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

  const categorizedShortcuts = useMemo(() => {
    const direct: Record<string, KeyboardShortcut> = {};
    const prefixGroups: Record<string, Record<string, KeyboardShortcut>> = {};
    const modified: Record<string, KeyboardShortcut> = {};

    shortcuts.forEach((shortcut) => {
      //should be active or not check
      if (!evaluateWhenCondition(shortcut.when)) {
        return;
      }

      if (
        (activeSubContext &&
          shortcut.subContext &&
          shortcut.subContext !== activeSubContext) ||
        (shortcut.subContext && !activeSubContext)
      ) {
        return;
      }

      const key = shortcut.key.toLowerCase();

      if (key.includes(" ")) {
        // Prefix shortcuts (like "g p", "g f", "e e")
        const parts = key.split(" ");
        if (parts.length === 2) {
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

  const matchesKeyCombo = useCallback(
    (keyCombo: string, event: KeyboardEvent): boolean => {
      const parts = keyCombo.split("+");
      const key = parts[parts.length - 1].toLowerCase();
      const modifiers = parts.slice(0, -1);

      // Handle numeric keys with shift modifier
      let expectedKey = key;
      if (modifiers.includes("shift") && /^\d$/.test(key)) {
        // Map numeric keys to their shifted equivalents
        const shiftMap: Record<string, string> = {
          "1": "!",
          "2": "@",
          "3": "#",
          "4": "$",
          "5": "%",
          "6": "^",
          "7": "&",
          "8": "*",
          "9": "(",
          "0": ")",
        };
        expectedKey = shiftMap[key] || key;
      }

      if (event.key.toLowerCase() !== expectedKey.toLowerCase()) return false;

      const requiredModifiers = {
        shift: false,
        ctrl: false,
        meta: false,
        alt: false,
      };

      modifiers.forEach((mod) => {
        switch (mod.toLowerCase()) {
          case "shift":
            requiredModifiers.shift = true;
            break;
          case "ctrl":
            requiredModifiers.ctrl = true;
            break;
          case "cmd":
          case "meta":
            requiredModifiers.meta = true;
            break;
          case "alt":
            requiredModifiers.alt = true;
            break;
        }
      });

      return (
        event.shiftKey === requiredModifiers.shift &&
        event.ctrlKey === requiredModifiers.ctrl &&
        event.metaKey === requiredModifiers.meta &&
        event.altKey === requiredModifiers.alt
      );
    },
    [],
  );

  const prefixActiveRef = useRef<string | null>(null);
  const [activePrefix, setActivePrefix] = useState<string | null>(null);
  const [isOptionPressed, setIsOptionPressed] = useState<boolean>(false);

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

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Track Option/Alt key state
      if (event.altKey !== isOptionPressed) {
        setIsOptionPressed(event.altKey);
      }

      // Skip if typing in input fields (unless explicitly allowed)
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      if (
        isInputField &&
        !event.ctrlKey &&
        !event.metaKey &&
        !ignoreInputFields
      ) {
        return;
      }

      const key = event.key.toLowerCase();
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
          }
        }
        prefixActiveRef.current = null;
        setActivePrefix(null);
        return;
      }

      const availablePrefixes = Object.keys(categorizedShortcuts.prefixGroups);
      if (
        availablePrefixes.includes(key) &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        prefixActiveRef.current = key;
        setActivePrefix(key);
        event.preventDefault();
        return;
      }

      const directShortcut = categorizedShortcuts.direct[key];
      if (
        directShortcut &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        const handler = handlers[directShortcut.action];
        if (handler) {
          event.preventDefault();
          event.stopPropagation();
          handler();
        }
      }
    },
    [categorizedShortcuts, handlers, matchesKeyCombo, isOptionPressed],
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      // Track Option/Alt key state
      if (event.altKey !== isOptionPressed) {
        setIsOptionPressed(event.altKey);
      }
    },
    [isOptionPressed],
  );

  const handleWindowBlur = useCallback(() => {
    // Reset Option key state when window loses focus
    setIsOptionPressed(false);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [handleKeyDown, handleKeyUp, handleWindowBlur]);

  return {
    shortcuts: shortcuts.filter((shortcut) =>
      evaluateWhenCondition(shortcut.when),
    ),
    activePrefix,
    isOptionPressed,
  };
}
