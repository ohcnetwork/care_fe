import { createFileRoute, useParams } from "@tanstack/react-router";

import PrintResourceLetter from "@/components/Resource/PrintResourceLetter";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/resource/$id/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({
    from: "/_app/facility/$facilityId/resource/$id/print",
  });
  return <PrintResourceLetter id={id} />;
}
