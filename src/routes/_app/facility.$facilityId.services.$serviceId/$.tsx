import { createFileRoute } from "@tanstack/react-router";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/$",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <ErrorPage />;
}
