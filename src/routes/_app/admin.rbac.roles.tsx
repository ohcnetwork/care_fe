import { createFileRoute } from "@tanstack/react-router";

import RolesIndex from "@/pages/Admin/Roles/RolesIndex";

export const Route = createFileRoute("/_app/admin/rbac/roles")({
  component: RouteComponent,
});

function RouteComponent() {
  return <RolesIndex />;
}
