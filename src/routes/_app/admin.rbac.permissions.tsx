import { createFileRoute } from "@tanstack/react-router";

import { permissionListSearch } from "@/lib/router/search/admin";
import { PermissionsIndex } from "@/pages/Admin/Permissions/PermissionsIndex";

export const Route = createFileRoute("/_app/admin/rbac/permissions")({
  validateSearch: permissionListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return <PermissionsIndex />;
}
