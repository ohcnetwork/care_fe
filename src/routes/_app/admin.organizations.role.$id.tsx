import { createFileRoute, useParams } from "@tanstack/react-router";

import ResponsibilitiesIndex from "@/pages/Admin/organizations/ResponsibilitiesIndex";

export const Route = createFileRoute("/_app/admin/organizations/role/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/admin/organizations/role/$id" });
  return <ResponsibilitiesIndex organizationId={id} />;
}
