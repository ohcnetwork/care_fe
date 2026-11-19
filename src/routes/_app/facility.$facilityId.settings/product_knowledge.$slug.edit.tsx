import { createFileRoute } from "@tanstack/react-router";

import ProductKnowledgeForm from "@/pages/Facility/settings/productKnowledge/ProductKnowledgeForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product_knowledge/$slug/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, slug } = Route.useParams();
  return <ProductKnowledgeForm facilityId={facilityId} slug={slug} />;
}
