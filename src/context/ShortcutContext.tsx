import { createContext, useContext, useEffect, useMemo, useState } from "react";

import actionsJson from "@/config/keyboardShortcuts.json";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { FacilityAction, FacilityActionId } from "@/types/shortcuts";
import { shortcutActionHandler } from "@/Utils/keyboardShortcutUtils";

interface ShortcutContextType {
  /**
   * Whether the command dialog is open
   */
  commandDialogOpen: boolean;
  /**
   * Set the command dialog open state
   */
  setCommandDialogOpen: (open: boolean) => void;
  /**
   * Current shortcut sub-context (e.g., "appointment-detail", "patient-detail")
   */
  subContext?: string;
  /**
   * Set the current shortcut sub-context
   */
  setSubContext: (subContext?: string) => void;
  /**
   * Whether shortcuts should run even when input fields are focused
   */
  ignoreInputFields: boolean;
  /**
   * Set whether shortcuts should run even when input fields are focused
   */
  setIgnoreInputFields: (ignore: boolean) => void;
}

const ShortcutContext = createContext<ShortcutContextType | null>(null);

interface ShortcutProviderProps {
  children: React.ReactNode;
  /**
   * Whether shortcuts should run even when input fields are focused
   * @default false
   */
  ignoreInputFields?: boolean;
}

function expandContext(key: string, sep = ":") {
  if (typeof key !== "string") return [];
  const clean = key
    .trim()
    .replace(new RegExp(`${sep}+`, "g"), sep)
    .replace(new RegExp(`^${sep}|${sep}$`, "g"), "");
  if (!clean) return [];
  const parts = clean.split(sep);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    out.push(parts.slice(0, i + 1).join(sep));
  }
  return out;
}

export function ShortcutProvider({
  children,
  ignoreInputFields: defaultIgnoreInputFields = false,
}: ShortcutProviderProps) {
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [subContext, setSubContext] = useState<string | undefined>();
  const [ignoreInputFields, setIgnoreInputFields] = useState(
    defaultIgnoreInputFields,
  );

  // Facility shortcuts logic (moved from useShortcutSubContext)
  const actions = useMemo((): FacilityAction[] => {
    const allContexts = expandContext(subContext || "");

    return ["global", ...allContexts]
      .map((context) => {
        const contextActions = actionsJson[context as keyof typeof actionsJson];

        if (!contextActions) return [];
        return contextActions.map((a) => ({
          id: a.action,
          handler: shortcutActionHandler(a.action),
        }));
      })
      .flat();
  }, [subContext]);

  const handlers = useMemo(() => {
    const handlersMap = {} as Record<FacilityActionId, () => void>;

    actions.forEach((action) => {
      handlersMap[action.id] = () => {
        action.handler();
      };
    });

    return handlersMap;
  }, [actions]);

  // Set up facility shortcuts
  useKeyboardShortcuts(
    ["global", ...expandContext(subContext || "")],
    { canCreate: true },
    handlers,
    subContext,
    ignoreInputFields,
  );

  const value = useMemo(
    () => ({
      commandDialogOpen,
      setCommandDialogOpen,
      subContext,
      setSubContext,
      ignoreInputFields,
      setIgnoreInputFields,
    }),
    [commandDialogOpen, subContext, ignoreInputFields],
  );

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
}

export function useShortcuts() {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error("useShortcuts must be used within a ShortcutProvider");
  }
  return context;
}

/**
 * Hook to set a shortcut sub-context for the current component.
 * This is a one-liner alternative to manually managing sub-contexts.
 *
 * @param subContext - The sub-context to set (e.g., "facility:appointment:detail")
 */
export function useShortcutSubContext(subContext?: string) {
  const shortcuts = useShortcuts();

  // Set sub-context if provided
  useEffect(() => {
    if (subContext) {
      shortcuts.setSubContext(subContext);
      return () => shortcuts.setSubContext(undefined);
    }
  }, [subContext, shortcuts]);

  return shortcuts;
}
