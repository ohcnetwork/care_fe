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
import { Plus } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { PERMISSION_CREATE_PATIENT } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { formatKeyboardShortcut } from "@/Utils/keyboardShortcutUtils";

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

interface FacilityCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function FacilityCommandDialog({
  open,
  onOpenChange,
  trigger,
}: FacilityCommandDialogProps) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacilitySilently();
  const { hasPermission } = usePermissions();

  const facilityActions: ActionGroup[] = useMemo(
    () => [
      {
        group: t("facility_actions"),
        items: [
          {
            id: "register-patient",
            label: t("register_new_patient"),
            shortcut: formatKeyboardShortcut("shift+p"),
            icon: <Plus />,
            permission: PERMISSION_CREATE_PATIENT,
          },
        ],
      },
    ],
    [t],
  );

  const handleSelect = useCallback(
    (actionId: string) => {
      document.dispatchEvent(
        new CustomEvent("trigger-facility-shortcut", {
          detail: { actionId },
        }),
      );
      onOpenChange(false);
    },
    [onOpenChange],
  );

  const isActionDisabled = useCallback(
    (action: ActionItem): boolean => {
      if (!facility) return true;
      if (action.permission) {
        return !hasPermission(action.permission, facility.permissions);
      }
      return false;
    },
    [facility, hasPermission],
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
                    disabled={isActionDisabled(action)}
                  >
                    {action.icon}
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
