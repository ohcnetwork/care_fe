import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceEditor } from "@/components/Workspace/WorkspaceEditor";
import { workspaceScopeForFacility } from "@/types/workspace/workspace";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/workspaces/create",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <WorkspaceEditor scope={workspaceScopeForFacility(facilityId)} />;
}
