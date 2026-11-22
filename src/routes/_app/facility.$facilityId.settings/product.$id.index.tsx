import { createFileRoute, useParams } from "@tanstack/react-router";

import ProductView from "@/pages/Facility/settings/product/ProductView";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product/$id/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/product/$id/",
  });
  return <ProductView facilityId={facilityId} productId={id} />;
}
