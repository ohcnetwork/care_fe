import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/product_knowledge",
)({
  staticData: { crumb: "product_knowledge" },
});
