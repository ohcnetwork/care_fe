import { createFileRoute } from "@tanstack/react-router";

import TemplatePage from "@/pages/Encounters/TemplateBuilder/TemplatePage";

export const Route = createFileRoute("/_app/facility/$facilityId/template/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <TemplatePage facilityId={facilityId} />;
}
