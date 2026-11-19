import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceList } from "@/components/Workspace/WorkspaceList";
import { workspaceScopeForFacility } from "@/types/workspace/workspace";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/workspaces/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <WorkspaceList scope={workspaceScopeForFacility(facilityId)} />;
}
