import { createFileRoute } from "@tanstack/react-router";

/** Report templates live in the settings workspace. */
export const Route = createFileRoute(
  "/_app/_legacy/facility/$facilityId/template",
)({ staticData: { workspace: "settings" } });
