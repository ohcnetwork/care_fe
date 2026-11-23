import { createFileRoute } from "@tanstack/react-router";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

export const Route = createFileRoute("/_app/not-found")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ErrorPage />;
}
