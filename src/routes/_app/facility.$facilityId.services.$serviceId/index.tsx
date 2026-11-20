import { createFileRoute } from "@tanstack/react-router";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

// The service page has no content of its own: its exact path was "not found".
export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <ErrorPage />;
}
