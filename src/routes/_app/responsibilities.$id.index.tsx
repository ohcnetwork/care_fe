import { createFileRoute } from "@tanstack/react-router";

import ResponsibilityLanding from "@/pages/Organization/ResponsibilityLanding";

export const Route = createFileRoute("/_app/responsibilities/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <ResponsibilityLanding id={id} />;
}
