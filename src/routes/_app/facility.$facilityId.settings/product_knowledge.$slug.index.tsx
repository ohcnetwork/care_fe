import { createFileRoute, useParams } from "@tanstack/react-router";

import ProductKnowledgeView from "@/pages/Facility/settings/productKnowledge/ProductKnowledgeView";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product_knowledge/$slug/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, slug } = useParams({
    from: "/_app/facility/$facilityId/settings/product_knowledge/$slug/",
  });
  return <ProductKnowledgeView facilityId={facilityId} slug={slug} />;
}
