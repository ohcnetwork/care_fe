import { createFileRoute } from "@tanstack/react-router";

import PatientProfileSettings from "@/pages/Patient/PatientProfileSettings";

export const Route = createFileRoute("/_patient/patient/profile")({
  component: PatientProfileSettings,
});
