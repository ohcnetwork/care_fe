import { createFileRoute, useParams } from "@tanstack/react-router";

import { WorkspaceEditor } from "@/components/Workspace/WorkspaceEditor";

import { INSTANCE_WORKSPACE_SCOPE } from "@/types/workspace/workspace";

export const Route = createFileRoute("/_app/admin/workspaces/$id/edit")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/admin/workspaces/$id/edit" });
  return <WorkspaceEditor scope={INSTANCE_WORKSPACE_SCOPE} id={id} />;
}
