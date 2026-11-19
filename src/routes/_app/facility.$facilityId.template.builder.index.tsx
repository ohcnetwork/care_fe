import { createFileRoute, useParams } from "@tanstack/react-router";

import TemplateBuilder from "@/pages/Encounters/TemplateBuilder/TemplateBuilder";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/template/builder/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/template/builder/",
  });
  return <TemplateBuilder facilityId={facilityId} />;
}
