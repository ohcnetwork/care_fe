import { createFileRoute } from "@tanstack/react-router";

import Login from "@/components/Auth/Login";
import { loginPageSearch } from "@/lib/router/search/auth";

export const Route = createFileRoute("/_public/forgot-password")({
  validateSearch: loginPageSearch,
  component: () => <Login forgot={true} />,
});
