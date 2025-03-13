import { DrawingTab } from "@/components/Common/Drawings/DrawingTab";

interface PatientDrawingTabProps {
  patientId: string;
}

export const PatientDrawingTab = (props: PatientDrawingTabProps) => {
  return <DrawingTab type="patient" patientId={props.patientId} />;
};
