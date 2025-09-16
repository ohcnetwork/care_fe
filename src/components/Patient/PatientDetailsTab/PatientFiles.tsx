import { FilesTab } from "@/components/Files/FilesTab";

import { FileType } from "@/types/files/file";

import { PatientProps } from ".";

export const PatientFilesTab = (props: PatientProps) => {
  return <FilesTab type={FileType.PATIENT} patient={props.patientData} />;
};
