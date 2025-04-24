import { DrawingTab } from "@/components/Common/Drawings/DrawingTab";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterDrawingsTab = (props: EncounterTabProps) => {
  return (
    <DrawingTab
      type="encounter"
      patient={props.patient}
      encounter={props.encounter}
    />
  );
};
