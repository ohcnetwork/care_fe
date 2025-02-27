import { DrawingTab } from "@/components/Common/Drawings/DrawingTab";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterDrawingsTab = (props: EncounterTabProps) => {
  return (
    <DrawingTab
      type="encounter"
      facilityId={props.facilityId}
      patientId={props.patient.id}
      encounter={props.encounter}
      drawingId={props.drawingId}
    />
  );
};
