import { createFileRoute } from "@tanstack/react-router";

import TemplateBuilder from "@/pages/Encounters/TemplateBuilder/TemplateBuilder";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/template/builder/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <TemplateBuilder facilityId={facilityId} />;
}
