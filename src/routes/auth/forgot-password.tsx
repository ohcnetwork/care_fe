import { createFileRoute } from "@tanstack/react-router";

import Login from "@/components/Auth/Login";

export const Route = createFileRoute("/auth/forgot-password")({
  component: () => <Login forgot={true} />,
});
