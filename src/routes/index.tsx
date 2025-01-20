import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "@/pages/Landing/LandingPage";

export const Route = createFileRoute("/")({
  component: () => <LandingPage />,
});
