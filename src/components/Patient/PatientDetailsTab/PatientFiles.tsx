import { FilesTab } from "@/components/Files/FilesTab";

import { PatientProps } from ".";

export const PatientFilesTab = (props: PatientProps) => {
  return (
    <FilesTab
      type="patient"
      patient={props.patientData}
      facilityId={props.facilityId}
    />
  );
};
