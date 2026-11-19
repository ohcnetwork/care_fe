import { createFileRoute } from "@tanstack/react-router";

import PrintResourceLetter from "@/components/Resource/PrintResourceLetter";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/resource/$id/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <PrintResourceLetter id={id} />;
}
