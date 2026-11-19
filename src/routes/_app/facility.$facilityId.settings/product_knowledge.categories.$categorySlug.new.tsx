import { createFileRoute, useParams } from "@tanstack/react-router";

import ProductKnowledgeForm from "@/pages/Facility/settings/productKnowledge/ProductKnowledgeForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product_knowledge/categories/$categorySlug/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, categorySlug } = useParams({
    from: "/_app/facility/$facilityId/settings/product_knowledge/categories/$categorySlug/new",
  });
  return (
    <ProductKnowledgeForm facilityId={facilityId} categorySlug={categorySlug} />
  );
}
