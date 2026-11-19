import { createFileRoute, useParams } from "@tanstack/react-router";

import ProductForm from "@/pages/Facility/settings/product/ProductForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product/$id/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/product/$id/edit",
  });
  return <ProductForm facilityId={facilityId} productId={id} />;
}
