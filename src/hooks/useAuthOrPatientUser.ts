import { useContext } from "react";

import { PatientUserContext } from "@/Providers/PatientUserProvider";

import { useAuthContext } from "./useAuthUser";

export function usePatientContext() {
  const ctx = useContext(PatientUserContext);
  if (!ctx) {
    return undefined;
  }
  return ctx;
}

export default function useAuthOrPatientUser() {
  const user = useAuthContext().user;
  const patient = usePatientContext()?.selectedPatient;
  if (!user && !patient) {
    throw new Error(
      "'useAuthOrPatientUser' must be used within 'App or PatientRouter' only",
    );
  }
  return { user, patient };
}
