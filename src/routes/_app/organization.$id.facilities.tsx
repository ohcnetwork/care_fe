import { createFileRoute, useParams } from "@tanstack/react-router";

import OrganizationFacilities from "@/pages/Organization/OrganizationFacilities";

export const Route = createFileRoute("/_app/organization/$id/facilities")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/organization/$id/facilities" });
  return <OrganizationFacilities id={id} />;
}
