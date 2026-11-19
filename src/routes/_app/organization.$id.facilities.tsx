import { createFileRoute } from "@tanstack/react-router";

import OrganizationFacilities from "@/pages/Organization/OrganizationFacilities";

export const Route = createFileRoute("/_app/organization/$id/facilities")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <OrganizationFacilities id={id} />;
}
