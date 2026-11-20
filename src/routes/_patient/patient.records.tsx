import { createFileRoute } from "@tanstack/react-router";

import PatientRecords from "@/pages/Patient/PatientRecords";

export const Route = createFileRoute("/_patient/patient/records")({
  component: PatientRecords,
});
