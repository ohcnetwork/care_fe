import { createFileRoute, useParams } from "@tanstack/react-router";

import OrganizationUsers from "@/pages/Organization/OrganizationUsers";

export const Route = createFileRoute("/_app/responsibilities/$id/users")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/responsibilities/$id/users" });
  return <OrganizationUsers id={id} routeContext="responsibility" />;
}
