import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintTemplatesSettings } from "@/pages/Facility/settings/PrintTemplatesSettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/print-templates",
)({
  component: RouteComponent,
  staticData: { crumb: "print_templates" },
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/print-templates",
  });
  return <PrintTemplatesSettings facilityId={facilityId} />;
}
