import { createFileRoute } from "@tanstack/react-router";

import TemplateBuilder from "@/pages/Encounters/TemplateBuilder/TemplateBuilder";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/template/builder/$slug",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, slug } = Route.useParams();
  return <TemplateBuilder facilityId={facilityId} slug={slug} />;
}
