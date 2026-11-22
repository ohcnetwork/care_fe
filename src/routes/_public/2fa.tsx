import { createFileRoute } from "@tanstack/react-router";

import { Authenticate } from "@/components/Auth/Authenticate";

export const Route = createFileRoute("/_public/2fa")({
  component: Authenticate,
});
