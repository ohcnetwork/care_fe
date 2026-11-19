import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceEditor } from "@/components/Workspace/WorkspaceEditor";
import { workspaceScopeForFacility } from "@/types/workspace/workspace";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/workspaces/$id/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return (
    <WorkspaceEditor scope={workspaceScopeForFacility(facilityId)} id={id} />
  );
}
