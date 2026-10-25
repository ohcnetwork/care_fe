import { PatientImmunizations } from "@/components/Immunization/PatientImmunizations";

/** Read-only: immunizations are recorded from an encounter. */
export const ImmunizationHistory = ({ patientId }: { patientId: string }) => {
  return (
    <div className="mx-auto max-w-5xl">
      <PatientImmunizations patientId={patientId} showTitle />
    </div>
  );
};
