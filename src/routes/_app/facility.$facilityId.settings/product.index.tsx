import { createFileRoute, useParams } from "@tanstack/react-router";

import ProductList from "@/pages/Facility/settings/product/ProductList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/product/",
  });
  return <ProductList facilityId={facilityId} />;
}
