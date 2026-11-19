import { createFileRoute } from "@tanstack/react-router";

import AdminOrganizationList from "@/pages/Admin/organizations/AdminOrganizationList";

export const Route = createFileRoute("/_app/admin/organizations/govt/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <AdminOrganizationList organizationType="govt" organizationId={id} />;
}
