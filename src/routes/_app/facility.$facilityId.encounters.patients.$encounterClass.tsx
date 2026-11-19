import { createFileRoute } from "@tanstack/react-router";

// The encounters layout renders the page.
export const Route = createFileRoute(
  "/_app/facility/$facilityId/encounters/patients/$encounterClass",
)({});
