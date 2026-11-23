import { createFileRoute, useParams } from "@tanstack/react-router";

import { productKnowledgePageSearch } from "@/lib/router/search/settings";
import ProductKnowledgeList from "@/pages/Facility/settings/productKnowledge/ProductKnowledgeList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product_knowledge/categories/$categorySlug/",
)({
  validateSearch: productKnowledgePageSearch,
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
