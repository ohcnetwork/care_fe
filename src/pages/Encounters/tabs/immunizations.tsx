import { getPermissions } from "@/common/Permissions";

import { PatientImmunizations } from "@/components/Immunization/PatientImmunizations";

import { usePermissions } from "@/context/PermissionContext";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";

export const EncounterImmunizationsTab = () => {
  const {
    patientId,
    patient,
    facilityId,
    selectedEncounter,
    selectedEncounterId,
    canWriteClinicalData,
  } = useEncounter();
  const { hasPermission } = usePermissions();
  const { facility } = useCurrentFacilitySilently();
  // Immunization permissions are facility scoped, not part of the encounter's.
  const { canWriteImmunization, canWriteImmunizationRecommendation } =
    getPermissions(
      hasPermission,
      facility?.id === facilityId ? (facility?.permissions ?? []) : [],
    );

  return (
    <PatientImmunizations
      patientId={patientId}
      write={
        facilityId && patient && canWriteClinicalData
          ? {
              patient,
              facilityId,
              encounterId: selectedEncounterId,
              defaultLocation: selectedEncounter?.current_location,
              canWriteRecords: canWriteImmunization,
              canWriteRecommendations: canWriteImmunizationRecommendation,
            }
          : undefined
      }
    />
  );
};
