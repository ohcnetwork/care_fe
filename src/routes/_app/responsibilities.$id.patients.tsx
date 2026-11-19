import { createFileRoute, useParams } from "@tanstack/react-router";

import OrganizationPatients from "@/pages/Organization/OrganizationPatients";

export const Route = createFileRoute("/_app/responsibilities/$id/patients")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/responsibilities/$id/patients" });
  return <OrganizationPatients id={id} routeContext="responsibility" />;
}
