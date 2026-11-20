import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_patient/patient/medications")({
  beforeLoad: () => {
    throw redirect({
      href: "/patient/records?tab=prescriptions",
      replace: true,
    });
  },
});
