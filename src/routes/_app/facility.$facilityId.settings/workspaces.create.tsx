import { createFileRoute, useParams } from "@tanstack/react-router";

import { WorkspaceEditor } from "@/components/Workspace/WorkspaceEditor";
import { workspaceScopeForFacility } from "@/types/workspace/workspace";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/workspaces/create",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/workspaces/create",
  });
  return <WorkspaceEditor scope={workspaceScopeForFacility(facilityId)} />;
}
