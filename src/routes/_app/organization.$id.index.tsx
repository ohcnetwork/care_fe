import { createFileRoute } from "@tanstack/react-router";

import OrganizationView from "@/pages/Organization/OrganizationView";

export const Route = createFileRoute("/_app/organization/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <OrganizationView id={id} />;
}
