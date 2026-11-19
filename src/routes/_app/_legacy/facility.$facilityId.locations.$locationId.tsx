import { createFileRoute } from "@tanstack/react-router";

/** Location workspace: location header and inner sidebar. */
export const Route = createFileRoute(
  "/_app/_legacy/facility/$facilityId/locations/$locationId",
)({ staticData: { workspace: "location" } });
