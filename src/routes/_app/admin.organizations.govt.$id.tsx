import { createFileRoute, useParams } from "@tanstack/react-router";

import AdminOrganizationList from "@/pages/Admin/organizations/AdminOrganizationList";

export const Route = createFileRoute("/_app/admin/organizations/govt/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/admin/organizations/govt/$id" });
  return <AdminOrganizationList organizationType="govt" organizationId={id} />;
}
