import { createFileRoute } from "@tanstack/react-router";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

export const Route = createFileRoute("/_app/facility/$facilityId/settings/$")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ErrorPage />;
}
