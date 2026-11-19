import { createFileRoute, useParams } from "@tanstack/react-router";

import ResponsibilityLanding from "@/pages/Organization/ResponsibilityLanding";

export const Route = createFileRoute("/_app/responsibilities/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/responsibilities/$id/" });
  return <ResponsibilityLanding id={id} />;
}
