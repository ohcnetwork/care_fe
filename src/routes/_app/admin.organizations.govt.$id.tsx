import { createFileRoute, useParams } from "@tanstack/react-router";

import { adminOrganizationListSearch } from "@/lib/router/search/admin";
import AdminOrganizationList from "@/pages/Admin/organizations/AdminOrganizationList";

export const Route = createFileRoute("/_app/admin/organizations/govt/$id")({
  validateSearch: adminOrganizationListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/admin/organizations/govt/$id" });
  return <AdminOrganizationList organizationType="govt" organizationId={id} />;
}
