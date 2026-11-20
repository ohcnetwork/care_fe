import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_patient/patient/diagnostic_reports")({
  beforeLoad: () => {
    throw redirect({ href: "/patient/records?tab=reports", replace: true });
  },
});
