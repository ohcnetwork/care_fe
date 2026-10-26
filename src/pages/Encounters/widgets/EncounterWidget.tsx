import {
  WorkspaceWidget,
  type WorkspaceWidgetProps,
} from "@/components/Workspace/WorkspaceWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";

export function EncounterWidget(props: Omit<WorkspaceWidgetProps, "context">) {
  const context = useEncounter();
  if (context.isSelectedEncounterLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }
  return <WorkspaceWidget {...props} context={context} />;
}
