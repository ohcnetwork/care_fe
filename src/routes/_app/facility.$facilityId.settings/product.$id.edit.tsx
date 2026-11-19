import { createFileRoute } from "@tanstack/react-router";

import ProductForm from "@/pages/Facility/settings/product/ProductForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product/$id/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return <ProductForm facilityId={facilityId} productId={id} />;
}
