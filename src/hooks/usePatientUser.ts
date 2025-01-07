import { useContext } from "react";

import { PatientUserContext } from "@/Providers/PatientUserProvider";

export function usePatientContext() {
  const ctx = useContext(PatientUserContext);
  if (!ctx) {
    throw new Error(
      "'usePatientContext' must be used within 'PatientUserProvider' only",
    );
  }
  return ctx;
}
