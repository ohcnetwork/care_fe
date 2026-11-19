import { createFileRoute, useParams } from "@tanstack/react-router";

import TemplateBuilder from "@/pages/Encounters/TemplateBuilder/TemplateBuilder";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/template/builder/$slug",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, slug } = useParams({
    from: "/_app/facility/$facilityId/template/builder/$slug",
  });
  return <TemplateBuilder facilityId={facilityId} slug={slug} />;
}
