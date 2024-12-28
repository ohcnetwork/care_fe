import { NeurologicalTable } from "@/components/Facility/Consultations/NeurologicalTables";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterNeurologicalMonitoringTab = (
  props: EncounterTabProps,
) => {
  return (
    <NeurologicalTable
      facilityId={props.facilityId}
      patientId={props.patient.id}
      consultationId={props.encounter.id}
    />
  );
};
