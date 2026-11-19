import { createFileRoute } from "@tanstack/react-router";

import OrganizationPatients from "@/pages/Organization/OrganizationPatients";

export const Route = createFileRoute("/_app/organization/$id/patients")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <OrganizationPatients id={id} />;
}
