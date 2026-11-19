import { createFileRoute } from "@tanstack/react-router";

import ProductKnowledgeList from "@/pages/Facility/settings/productKnowledge/ProductKnowledgeList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product_knowledge/categories/$categorySlug/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, categorySlug } = Route.useParams();
  return (
    <ProductKnowledgeList facilityId={facilityId} categorySlug={categorySlug} />
  );
}
