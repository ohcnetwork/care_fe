import { createFileRoute } from "@tanstack/react-router";

import ResponsibilitiesIndex from "@/pages/Admin/organizations/ResponsibilitiesIndex";

export const Route = createFileRoute("/_app/admin/organizations/role/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ResponsibilitiesIndex />;
}
