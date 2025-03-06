import { DrawingTab } from "@/components/Common/Drawings/DrawingTab";

import { PatientProps } from ".";

export const PatientDrawingTab = (props: PatientProps) => {
  return (
    <DrawingTab
      facilityId={props.facilityId}
      type="patient"
      patientId={props.patientId}
    />
  );
};
