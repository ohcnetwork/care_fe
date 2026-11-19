import { createFileRoute, useParams } from "@tanstack/react-router";

import ProductKnowledgeList from "@/pages/Facility/settings/productKnowledge/ProductKnowledgeList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product_knowledge/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/product_knowledge/",
  });
  return <ProductKnowledgeList facilityId={facilityId} />;
}
