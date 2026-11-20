import { createFileRoute } from "@tanstack/react-router";

import OrganizationIndex from "@/pages/Organization/OrganizationIndex";

export const Route = createFileRoute("/_app/organization/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <OrganizationIndex />;
}
