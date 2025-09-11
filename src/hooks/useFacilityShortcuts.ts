import { useNavigate } from "raviger";
import { useEffect, useMemo, useState } from "react";

import {
  PERMISSION_CREATE_ENCOUNTER,
  PERMISSION_CREATE_PATIENT,
} from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { FacilityAction, FacilityActionId } from "@/types/shortcuts";
import {
  shortcutActionHandler,
  shortcutActionHandlers,
} from "@/Utils/keyboardShortcutUtils";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

export function useFacilityShortcuts(subContext?: string) {
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
      {
        id: "create-encounter",
        handler: shortcutActionHandler("create-encounter"),
        permission: PERMISSION_CREATE_ENCOUNTER,
      },
      {
        id: "edit-invoice-items",
        handler: shortcutActionHandler("edit-invoice-items"),
      },
      {
        id: "add-charge-item",
        handler: shortcutActionHandler("add-charge-item"),
      },
      {
        id: "other-charge-items",
        handler: shortcutActionHandler("other-charge-items"),
      },
      {
        id: "issue-invoice",
        handler: shortcutActionHandler("issue-invoice"),
      },
      {
        id: "mark-as-balanced",
        handler: shortcutActionHandler("mark-as-balanced"),
      },
      {
        id: "record-payment",
        handler: shortcutActionHandler("record-payment"),
      },
      {
        id: "select-chargeItem-billing-sheet",
        handler: shortcutActionHandler("select-chargeItem-billing-sheet"),
      },
      // Account show shortcuts
      {
        id: "settle-close-account",
        handler: shortcutActionHandler("settle-close-account"),
      },
      {
        id: "create-invoice",
        handler: shortcutActionHandler("create-invoice"),
      },
      {
        id: "record-payment-account",
        handler: shortcutActionHandler("record-payment-account"),
      },
      {
        id: "edit-account",
        handler: shortcutActionHandler("edit-account"),
      },
      {
        id: "view-statement",
        handler: shortcutActionHandler("view-statement"),
      },
      {
        id: "switch-to-invoices-tab",
        handler: shortcutActionHandler("switch-to-invoices-tab"),
      },
      {
        id: "switch-to-charge-items-tab",
        handler: shortcutActionHandler("switch-to-charge-items-tab"),
      },
      {
        id: "switch-to-payments-tab",
        handler: shortcutActionHandler("switch-to-payments-tab"),
      },
      {
        id: "switch-to-bed-associations-tab",
        handler: shortcutActionHandler("switch-to-bed-associations-tab"),
      },
      {
        id: "add-charge-items-create-invoice",
        handler: shortcutActionHandler("add-charge-items-create-invoice"),
      },
      {
        id: "submit-charge-items-billing-sheet",
        handler: shortcutActionHandler("submit-charge-items-billing-sheet"),
      },
      {
        id: "go-back",
        handler: shortcutActionHandler("go-back"),
      },
      {
        id: "view-invoice-payment",
        handler: shortcutActionHandler("view-invoice-payment"),
      },
      {
        id: "mark-payment-cancelled",
        handler: shortcutActionHandler("mark-payment-cancelled"),
      },
      {
        id: "mark-payment-error",
        handler: shortcutActionHandler("mark-payment-error"),
      },
      {
        id: "print-payment-receipt",
        handler: shortcutActionHandler("print-payment-receipt"),
      },
      {
        id: "edit-invoice-item",
        handler: shortcutActionHandler("edit-invoice-item"),
      },
      {
        id: "print-invoice",
        handler: shortcutActionHandler("print-invoice"),
      },
      {
        id: "print-button",
        handler: shortcutActionHandler("print-button"),
      },
      // if you dont need permission checks just add bellow
      ...shortcutActionHandlers([
        "patient-home",
        "print-token",
        "generate-token",
        "schedule-appointment",
      ]),

      // Generic action handlers
      {
        id: "cancel-action",
        handler: shortcutActionHandler("cancel-action"),
      },
      {
        id: "submit-action",
        handler: shortcutActionHandler("submit-action"),
      },
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
    subContext,
  );

  return {
    ...keyboardShortcuts,
    commandDialogOpen,
    setCommandDialogOpen,
  };
}
