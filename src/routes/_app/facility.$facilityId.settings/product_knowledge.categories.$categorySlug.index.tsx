import { createFileRoute, useParams } from "@tanstack/react-router";

import ProductKnowledgeList from "@/pages/Facility/settings/productKnowledge/ProductKnowledgeList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product_knowledge/categories/$categorySlug/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, categorySlug } = useParams({
    from: "/_app/facility/$facilityId/settings/product_knowledge/categories/$categorySlug/",
  });
  return (
    <ProductKnowledgeList facilityId={facilityId} categorySlug={categorySlug} />
  );
}
