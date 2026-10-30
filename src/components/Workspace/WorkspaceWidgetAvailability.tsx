import { History, LockKeyhole, PenLine } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { getWidgetRequirements } from "@/types/workspace/widgetAvailability";

function Badge({
  tone,
  icon: Icon,
  children,
}: {
  tone: "warning" | "muted";
  icon: typeof History;
  children: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
        tone === "warning"
          ? "bg-amber-50 text-amber-900"
          : "bg-muted-background text-soft-foreground",
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {children}
    </span>
  );
}

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
  const editorsOnly =
    requirement.access === "write" || requirement.access === "actions";
  if (requirement.encounter === "any" && !editorsOnly) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {requirement.encounter === "active" && (
        <Badge tone="warning" icon={LockKeyhole}>
          {t("workspace_auto_hides_closed")}
        </Badge>
      )}
      {requirement.encounter === "none" && (
        <Badge tone="muted" icon={History}>
          {t("workspace_patient_context")}
        </Badge>
      )}
      {editorsOnly && (
        <Badge tone="warning" icon={PenLine}>
          {t(
            requirement.access === "actions"
              ? "workspace_editors_only_actions"
              : "workspace_editors_only",
          )}
        </Badge>
      )}
    </span>
  );
}
