import { HTTPError } from "@/Utils/request/types";

export function isEncounterAccessDenied({
  isPrimaryEncounterLoading,
  isPatientLoading,
  canReadClinicalData,
  canReadSelectedEncounter,
  primaryEncounterError,
}: {
  isPrimaryEncounterLoading: boolean;
  isPatientLoading: boolean;
  canReadClinicalData: boolean;
  canReadSelectedEncounter: boolean;
  primaryEncounterError: Error | null;
}): boolean {
  if (isPrimaryEncounterLoading || isPatientLoading) {
    return false;
  }

  if (
    primaryEncounterError instanceof HTTPError &&
    primaryEncounterError.status === 403
  ) {
    return true;
  }

  if (primaryEncounterError) {
    return false;
  }

  return !canReadClinicalData && !canReadSelectedEncounter;
}
