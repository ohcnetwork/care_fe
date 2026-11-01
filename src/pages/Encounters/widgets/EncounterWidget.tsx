import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  WorkspaceWidget,
  type WorkspaceWidgetProps,
} from "@/components/Workspace/WorkspaceWidget";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export function EncounterWidget(props: Omit<WorkspaceWidgetProps, "context">) {
  const { t } = useTranslation();
  const context = useEncounter();
  if (context.isSelectedEncounterLoading) {
    return (
      <div role="status" aria-label={t("loading")}>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }
  // Without this, the shared renderer would treat the missing encounter as
  // patient history and silently show patient-wide data on the encounter page.
  if (!context.selectedEncounter) {
    return (
      <EmptyState
        icon={<ShieldAlert className="size-8 text-placeholder-foreground" />}
        title={t("no_permission_to_view_clinical_data")}
        description={t("no_permission_to_view_clinical_data_description")}
      />
    );
  }
  return <WorkspaceWidget {...props} context={context} />;
}
