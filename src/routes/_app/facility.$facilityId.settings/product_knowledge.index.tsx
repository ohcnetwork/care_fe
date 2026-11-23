import { createFileRoute, useParams } from "@tanstack/react-router";

import { productKnowledgePageSearch } from "@/lib/router/search/settings";
import ProductKnowledgeList from "@/pages/Facility/settings/productKnowledge/ProductKnowledgeList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product_knowledge/",
)({
  validateSearch: productKnowledgePageSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/product_knowledge/",
  });
  return <ProductKnowledgeList facilityId={facilityId} />;
}
