import { createFileRoute } from "@tanstack/react-router";

import InvalidReset from "@/components/ErrorPages/InvalidReset";

export const Route = createFileRoute("/_public/invalid-reset")({
  component: InvalidReset,
});
