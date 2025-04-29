import { DrawingTab } from "@/components/Common/Drawings/DrawingTab";

import { Patient } from "@/types/emr/newPatient";

interface PatientDrawingTabProps {
  patientId: string;
  patientData?: Patient;
}

export const PatientDrawingTab = (props: PatientDrawingTabProps) => {
  return (
    <DrawingTab
      type="patient"
      patient={props.patientData}
      patientId={props.patientId}
    />
  );
};
