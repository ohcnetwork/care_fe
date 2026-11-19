import { createFileRoute } from "@tanstack/react-router";

import { staffOrPatient } from "@/lib/router/auth";
import PatientIndex from "@/pages/Patient/index";
import AppRouter from "@/Routers/AppRouter";
import { useArea } from "@/Routers/AreaChrome";

/**
 * Shared URL: the patient portal home. For staff it is `/patient/:id` of
 * the legacy tables (with `home` as the id), as before.
 */
export const Route = createFileRoute("/patient/home")({
  beforeLoad: staffOrPatient,
  component: RouteComponent,
});

function RouteComponent() {
  return useArea() === "patient" ? <PatientIndex /> : <AppRouter />;
}
