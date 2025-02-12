import { FilesTab } from "@/components/Files/FilesTab";

import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";

export const EncounterFilesTab = (props: EncounterTabProps) => {
  return (
    <FilesTab
      type="encounter"
      facilityId={props.facilityId}
      encounter={props.encounter}
    />
  );
};
