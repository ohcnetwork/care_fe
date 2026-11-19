import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/charge_item_definitions",
)({
  staticData: { crumb: "charge_item_definitions" },
});
