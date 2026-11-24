import { createFileRoute } from "@tanstack/react-router";

import { adminOrganizationListSearch } from "@/lib/router/search/admin";
import AdminOrganizationList from "@/pages/Admin/organizations/AdminOrganizationList";

export const Route = createFileRoute("/_app/admin/organizations/govt/")({
  validateSearch: adminOrganizationListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return <AdminOrganizationList organizationType="govt" />;
}
