import PatientNotesListComponent from "@/components/Facility/PatientNotesListComponent";

interface PatientNotesProps {
  id: string;
  facilityId: string;
}

const PatientNotes = (props: PatientNotesProps) => {
  const { id: patientId, facilityId } = props;

  return (
    <PatientNotesListComponent
      allowThreadView={false}
      patientId={patientId}
      facilityId={facilityId}
      className="m-5"
    />
  );
};

export default PatientNotes;
