import { createFileRoute } from "@tanstack/react-router";

import { PatientProfile } from "@/components/Patient/PatientProfile";

import { staffOrPatient } from "@/lib/router/auth";
import { patientShowSearch } from "@/lib/router/search/patient";
import PatientIndex from "@/pages/Patient/index";
import { useArea } from "@/Routers/AreaChrome";

/**
 * Shared URL: the patient portal home. Staff users get the staff patient
 * page, with `home` as the patient id, as before.
 */
export const Route = createFileRoute("/patient/home")({
  beforeLoad: staffOrPatient,
  validateSearch: patientShowSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return useArea() === "patient" ? (
    <PatientIndex />
  ) : (
    <PatientProfile id="home" page="demography" />
  );
}
