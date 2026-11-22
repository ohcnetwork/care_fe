import { createFileRoute, useParams } from "@tanstack/react-router";

import { WorkspaceList } from "@/components/Workspace/WorkspaceList";
import { workspaceScopeForFacility } from "@/types/workspace/workspace";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/workspaces/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/workspaces/",
  });
  return <WorkspaceList scope={workspaceScopeForFacility(facilityId)} />;
}
