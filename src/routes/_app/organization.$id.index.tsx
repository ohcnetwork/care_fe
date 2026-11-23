import { createFileRoute, useParams } from "@tanstack/react-router";

import { organizationViewSearch } from "@/lib/router/search/organization";
import OrganizationView from "@/pages/Organization/OrganizationView";

export const Route = createFileRoute("/_app/organization/$id/")({
  validateSearch: organizationViewSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/organization/$id/" });
  return <OrganizationView id={id} />;
}
