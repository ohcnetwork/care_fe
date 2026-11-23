import { createFileRoute } from "@tanstack/react-router";

import { roleListSearch } from "@/lib/router/search/admin";
import RolesIndex from "@/pages/Admin/Roles/RolesIndex";

export const Route = createFileRoute("/_app/admin/rbac/roles")({
  validateSearch: roleListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return <RolesIndex />;
}
