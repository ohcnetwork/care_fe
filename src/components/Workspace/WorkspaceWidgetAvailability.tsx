import { History, LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { getWidgetRequirements } from "@/types/workspace/widgetAvailability";

/** Only rules an author might not expect are labelled; needing an encounter is the norm. */
export function WorkspaceWidgetAvailability({
  type,
  requiresActiveEncounter,
}: {
  type: string;
  requiresActiveEncounter?: boolean;
}) {
  const { t } = useTranslation();
  const requirement = getWidgetRequirements(type, requiresActiveEncounter);
  if (requirement.encounter === "any") return null;
  const activeOnly = requirement.encounter === "active";
  const Icon = activeOnly ? LockKeyhole : History;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
        activeOnly ? "bg-amber-50 text-amber-900" : "bg-gray-100 text-gray-600",
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {t(
        activeOnly
          ? "workspace_auto_hides_closed"
          : "workspace_patient_context",
      )}
    </span>
  );
}
