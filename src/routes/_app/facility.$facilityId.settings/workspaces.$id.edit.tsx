import { createFileRoute, useParams } from "@tanstack/react-router";

import { WorkspaceEditor } from "@/components/Workspace/WorkspaceEditor";
import { workspaceScopeForFacility } from "@/types/workspace/workspace";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/workspaces/$id/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/workspaces/$id/edit",
  });
  return (
    <WorkspaceEditor scope={workspaceScopeForFacility(facilityId)} id={id} />
  );
}
