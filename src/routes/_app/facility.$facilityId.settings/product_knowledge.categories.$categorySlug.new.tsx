import { createFileRoute } from "@tanstack/react-router";

import ProductKnowledgeForm from "@/pages/Facility/settings/productKnowledge/ProductKnowledgeForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product_knowledge/categories/$categorySlug/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, categorySlug } = Route.useParams();
  return (
    <ProductKnowledgeForm facilityId={facilityId} categorySlug={categorySlug} />
  );
}
