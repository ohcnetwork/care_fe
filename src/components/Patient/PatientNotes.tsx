import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import Page from "@/components/Common/Page";
import PatientNotesListComponent from "@/components/Facility/PatientNotesListComponent";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";

interface PatientNotesProps {
  patientId: string;
  facilityId: string;
  consultationId?: string;
}

const PatientNotes = (props: PatientNotesProps) => {
  const { patientId, facilityId, consultationId } = props;

  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");

  const { data: patientData } = useQuery({
    queryKey: [routes.getPatient.path, patientId],
    queryFn: query(routes.getPatient, {
      pathParams: { id: patientId },
    }),
    enabled: !!patientId,
  });

  if (patientData) {
    if (patientData.name && patientData.name !== patientName) {
      setPatientName(patientData.name);
    }
    if (
      patientData.facility_object?.name &&
      patientData.facility_object.name !== facilityName
    ) {
      setFacilityName(patientData.facility_object.name);
    }
  }

  return (
    <Page
      title="Discussion Notes"
      className="relative flex min-h-[calc(100vh-3rem)] flex-col"
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [patientId]: { name: patientName },
      }}
      backUrl={`/facility/${facilityId}/patient/${patientId}`}
    >
      <div className="flex-1 overflow-hidden">
        <PatientNotesListComponent
          patientId={patientId}
          facilityId={facilityId}
          consultationId={consultationId}
        />
      </div>
    </Page>
  );
};

export default PatientNotes;
