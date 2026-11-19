import { createFileRoute, useParams } from "@tanstack/react-router";

import OrganizationView from "@/pages/Organization/OrganizationView";

export const Route = createFileRoute("/_app/organization/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/organization/$id/" });
  return <OrganizationView id={id} />;
}
