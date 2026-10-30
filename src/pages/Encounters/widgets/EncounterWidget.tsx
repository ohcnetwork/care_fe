import { useTranslation } from "react-i18next";

import {
  WorkspaceWidget,
  type WorkspaceWidgetProps,
} from "@/components/Workspace/WorkspaceWidget";
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
  return <WorkspaceWidget {...props} context={context} />;
}
