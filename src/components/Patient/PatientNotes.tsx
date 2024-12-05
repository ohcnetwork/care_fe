import { useState } from "react";

import Page from "@/components/Common/Page";
import PatientNotesListComponent from "@/components/Facility/PatientNotesListComponent";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

interface PatientNotesProps {
  patientId: string;
  facilityId: string;
  consultationId?: string;
}

const PatientNotes = (props: PatientNotesProps) => {
  const { patientId, facilityId, consultationId } = props;

  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");

  useQuery(routes.getPatient, {
    pathParams: { id: patientId },
    onResponse: ({ data }) => {
      if (data) {
        setPatientName(data.name ?? "");
        setFacilityName(data.facility_object?.name ?? "");
      }
    },
  });

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
