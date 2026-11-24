import { createFileRoute, useParams } from "@tanstack/react-router";

import { organizationPatientListSearch } from "@/lib/router/search/organization";
import OrganizationPatients from "@/pages/Organization/OrganizationPatients";

export const Route = createFileRoute("/_app/responsibilities/$id/patients")({
  validateSearch: organizationPatientListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/responsibilities/$id/patients" });
  return <OrganizationPatients id={id} routeContext="responsibility" />;
}
