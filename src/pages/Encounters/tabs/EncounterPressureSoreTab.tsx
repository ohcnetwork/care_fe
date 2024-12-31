import { PressureSoreDiagrams } from "@/components/Facility/Consultations/PressureSoreDiagrams";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterPressureSoreTab = (props: EncounterTabProps) => {
  return <PressureSoreDiagrams consultationId={props.encounter.id} />;
};
