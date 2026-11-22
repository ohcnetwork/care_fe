import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceList } from "@/components/Workspace/WorkspaceList";

import { workspaceListSearch } from "@/lib/router/search/encounter";
import { INSTANCE_WORKSPACE_SCOPE } from "@/types/workspace/workspace";

export const Route = createFileRoute("/_app/admin/workspaces/")({
  validateSearch: workspaceListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return <WorkspaceList scope={INSTANCE_WORKSPACE_SCOPE} />;
}
