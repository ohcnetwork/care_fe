import { createFileRoute, useParams } from "@tanstack/react-router";

import { WorkspaceList } from "@/components/Workspace/WorkspaceList";
import { workspaceListSearch } from "@/lib/router/search/encounter";
import { workspaceScopeForFacility } from "@/types/workspace/workspace";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/workspaces/",
)({
  validateSearch: workspaceListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/workspaces/",
  });
  return <WorkspaceList scope={workspaceScopeForFacility(facilityId)} />;
}
