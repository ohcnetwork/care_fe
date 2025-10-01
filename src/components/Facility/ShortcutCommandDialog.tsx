import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import actionsJson from "@/config/keyboardShortcuts.json";
import { useShortcuts } from "@/context/ShortcutContext";
import {
  formatKeyboardShortcut,
  shortcutActionHandler,
} from "@/Utils/keyboardShortcutUtils";
import { expandShortcutContext } from "@/Utils/shortcutUtils";

interface ActionItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  permission?: string;
}

interface ActionGroup {
  group: string;
  items: ActionItem[];
}

interface ShortcutCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ShortcutCommandDialog({
  open,
  onOpenChange,
  trigger,
}: ShortcutCommandDialogProps) {
  const { t } = useTranslation();
  const { subContext } = useShortcuts();

  const facilityActions: ActionGroup[] = useMemo(() => {
    const allContexts = expandShortcutContext(subContext || "");
    const contextsToSearch = [
      ...(subContext?.includes("-global") ? [] : ["global"]),
      ...allContexts,
    ];

    const actionGroups: ActionGroup[] = [];

    contextsToSearch.forEach((context) => {
      const contextActions = actionsJson[context as keyof typeof actionsJson];

      if (!contextActions || contextActions.length === 0) return;

      const items: ActionItem[] = contextActions
        .filter((action) => {
          if (action.action === "show-shortcuts") {
            return false;
          }

          // Only include actions if the corresponding element exists on the page
          const element = document.querySelector(
            `[data-shortcut-id='${action.action}']`,
          );
          return element !== null;
        })
        .map((action) => ({
          id: action.action,
          label: action.description,
          shortcut: formatKeyboardShortcut(action.key),
        }));

      if (items.length > 0) {
        actionGroups.push({
          group: context.replace(/:/g, " ").toUpperCase(),
          items,
        });
      }
    });

    return actionGroups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subContext, open]);

  const handleSelect = useCallback(
    (actionId: string) => {
      shortcutActionHandler(actionId)();
      onOpenChange(false);
    },
    [onOpenChange],
  );

  return (
    <>
      {trigger}
      <CommandDialog
        open={open}
        onOpenChange={onOpenChange}
        className="md:max-w-2xl"
      >
        <div className="border-b border-gray-100 shadow-xs">
          <CommandInput
            placeholder={t("search")}
            className="border-none focus:ring-0"
          />
        </div>
        <CommandList className="h-[80vh] max-h-[80vh] w-full">
          <CommandEmpty>{t("no_results")}</CommandEmpty>
          {facilityActions.map((group) => (
            <div key={group.group}>
              <CommandGroup heading={group.group} className="px-2">
                {group.items.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={action.id}
                    onSelect={() => handleSelect(action.id)}
                    className="rounded-md cursor-pointer hover:bg-gray-100 flex justify-between aria-selected:bg-gray-100"
                    autoFocus={false}
                  >
                    <span className="flex-1">{action.label}</span>
                    {action.shortcut && (
                      <CommandShortcut className="ml-2 text-xs text-gray-500 bg-white border border-gray-200 shadow-xs px-1.5 py-0.5 rounded">
                        {action.shortcut}
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
