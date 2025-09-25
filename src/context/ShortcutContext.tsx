import { createContext, useContext, useEffect, useMemo, useState } from "react";

import actionsJson from "@/config/keyboardShortcuts.json";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { FacilityAction, FacilityActionId } from "@/types/shortcuts";
import {
  formatKeyboardShortcut,
  shortcutActionHandler,
} from "@/Utils/keyboardShortcutUtils";
import { expandShortcutContext } from "@/Utils/shortcutUtils";

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
  /**
   * Get the display string for a shortcut action ID based on current context
   */
  getShortcutDisplay: (actionId: string) => string | undefined;
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

export function ShortcutProvider({
  children,
  ignoreInputFields: defaultIgnoreInputFields = false,
}: ShortcutProviderProps) {
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [subContext, setSubContext] = useState<string | undefined>();
  const [ignoreInputFields, setIgnoreInputFields] = useState(
    defaultIgnoreInputFields,
  );
  const isMobile = useIsMobile();

  // Facility shortcuts logic (moved from useShortcutSubContext)
  const actions = useMemo((): FacilityAction[] => {
    const allContexts = expandShortcutContext(subContext || "");

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

  // Function to get shortcut display string for an action ID
  const getShortcutDisplay = useMemo(() => {
    return (actionId: string): string | undefined => {
      if (isMobile) {
        return undefined;
      }

      // Search through current context hierarchy + global
      const allContexts = expandShortcutContext(subContext || "");
      const contextsToSearch = ["global", ...allContexts];

      for (const context of contextsToSearch) {
        const contextActions = actionsJson[context as keyof typeof actionsJson];
        if (!contextActions) continue;

        const shortcut = contextActions.find((s) => s.action === actionId);
        if (shortcut) {
          return formatKeyboardShortcut(shortcut.key);
        }
      }

      return undefined;
    };
  }, [subContext, isMobile]);

  // Set up facility shortcuts
  useKeyboardShortcuts(
    ["global", ...expandShortcutContext(subContext || "")],
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
      getShortcutDisplay,
    }),
    [commandDialogOpen, subContext, ignoreInputFields, getShortcutDisplay],
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
 * Hook to get shortcut display strings based on current context.
 * Returns a function that can be called with an action ID to get the display string.
 *
 * This hook automatically uses the current shortcut context hierarchy, so shortcuts
 * from parent contexts (e.g., "facility" when in "facility:patient:home") are available.
 * It also supports multiple context hierarchies with the & separator.
 *
 * @returns Function to get display string for an action ID
 *
 * @example
 * // In a component with context "facility:patient:home"
 * const getShortcutDisplay = useShortcutDisplay();
 * const printShortcut = getShortcutDisplay("print-button"); // "P" (from global or facility context)
 * const tokenShortcut = getShortcutDisplay("print-token"); // "P" (from facility:patient:home context)
 *
 * @example
 * // Usage in a button component
 * function PrintButton() {
 *   const getShortcutDisplay = useShortcutDisplay();
 *   const shortcut = getShortcutDisplay("print-button");
 *
 *   return (
 *     <button data-shortcut-id="print-button">
 *       Print {shortcut && <span className="ml-2 text-xs">({shortcut})</span>}
 *     </button>
 *   );
 * }
 */
export function useShortcutDisplay() {
  const { getShortcutDisplay } = useShortcuts();
  return getShortcutDisplay;
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
