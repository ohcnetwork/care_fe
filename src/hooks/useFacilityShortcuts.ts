import { useNavigate } from "raviger";
import { useEffect, useMemo, useState } from "react";

import { PERMISSION_CREATE_PATIENT } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { FacilityAction, FacilityActionId } from "@/types/shortcuts";
import { shortcutActionHandler } from "@/Utils/keyboardShortcutUtils";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

export function useFacilityShortcuts() {
  const navigate = useNavigate();
  const { facility } = useCurrentFacilitySilently();
  const { hasPermission } = usePermissions();
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);

  const actions = useMemo((): FacilityAction[] => {
    return [
      {
        id: "show-shortcuts",
        handler: () => setCommandDialogOpen(true),
      },
      {
        id: "register-patient",
        handler: () => navigate(`/facility/${facility?.id}/patient/create`),
        requiresFacility: true,
        permission: PERMISSION_CREATE_PATIENT,
      },
      // Generic shortcut handlers - just add the ID here!
      // To add new shortcuts: just add the ID to this array and add data-shortcut-id to the element
      { id: "patient-home", handler: shortcutActionHandler("patient-home") },
      { id: "print-token", handler: shortcutActionHandler("print-token") },
    ];
  }, [navigate, facility?.id]);

  const handlers = useMemo(() => {
    const handlersMap = {} as Record<FacilityActionId, () => void>;

    actions.forEach((action) => {
      handlersMap[action.id] = () => {
        if (action.requiresFacility && !facility) {
          return;
        }

        if (action.permission && facility) {
          if (!hasPermission(action.permission, facility.permissions)) {
            return;
          }
        }

        action.handler();
      };
    });

    return handlersMap;
  }, [actions, facility, hasPermission]);

  useEffect(() => {
    const handleShortcutTrigger = (
      event: CustomEvent<{ actionId: FacilityActionId }>,
    ) => {
      const handler = handlers[event.detail.actionId];
      if (handler) {
        handler();
      }
    };

    document.addEventListener(
      "trigger-facility-shortcut",
      handleShortcutTrigger as EventListener,
    );

    return () => {
      document.removeEventListener(
        "trigger-facility-shortcut",
        handleShortcutTrigger as EventListener,
      );
    };
  }, [handlers]);

  const keyboardShortcuts = useKeyboardShortcuts(
    ["facility"],
    { canCreate: true },
    handlers,
  );

  return {
    ...keyboardShortcuts,
    commandDialogOpen,
    setCommandDialogOpen,
  };
}
