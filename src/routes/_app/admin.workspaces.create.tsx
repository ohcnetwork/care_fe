import { createFileRoute } from "@tanstack/react-router";

import { WorkspaceEditor } from "@/components/Workspace/WorkspaceEditor";

import { INSTANCE_WORKSPACE_SCOPE } from "@/types/workspace/workspace";

export const Route = createFileRoute("/_app/admin/workspaces/create")({
  component: RouteComponent,
});

function RouteComponent() {
  return <WorkspaceEditor scope={INSTANCE_WORKSPACE_SCOPE} />;
}
