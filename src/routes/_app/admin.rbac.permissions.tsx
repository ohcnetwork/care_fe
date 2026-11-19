import { createFileRoute } from "@tanstack/react-router";

import { PermissionsIndex } from "@/pages/Admin/Permissions/PermissionsIndex";

export const Route = createFileRoute("/_app/admin/rbac/permissions")({
  component: RouteComponent,
});

function RouteComponent() {
  return <PermissionsIndex />;
}
