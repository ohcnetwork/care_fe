import { useState } from "react";
import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";
import { PatientModel } from "../../Patient/models";
import ViewInvestigationSuggestions from "./InvestigationSuggestions";
import { InvestigationResponse } from "./Reports/types";
import ViewInvestigations from "./ViewInvestigations";

export interface InvestigationSessionType {
  session_external_id: string;
  session_created_date: string;
}

export default function InvestigationTab(props: {
  consultationId: string;
  patientId: string;
  facilityId: string;
  patientData: PatientModel;
}) {
  const { consultationId, patientId, facilityId, patientData } = props;

  const [investigations, setInvestigations] = useState<InvestigationResponse>(
    []
  );
  const [investigationSessions, setInvestigationSessions] = useState<
    InvestigationSessionType[]
  >([]);

  const { loading: investigationLoading } = useQuery(routes.getInvestigation, {
    pathParams: {
      consultation_external_id: consultationId,
    },
    onResponse: (res) => {
      if (res && res.data) {
        setInvestigations(res.data.results);
      }
    },
  });

  const { loading: investigationSessionLoading } = useQuery(
    routes.getInvestigationSessions,
    {
      pathParams: {
        consultation_external_id: consultationId,
      },
      onResponse: (res) => {
        if (res && res.data) {
          setInvestigationSessions(res.data);
        }
      },
    }
  );

  return (
    <>
      <ViewInvestigations
        isLoading={investigationLoading || investigationSessionLoading}
        investigations={investigations}
        investigationSessions={investigationSessions}
        consultationId={consultationId}
        facilityId={facilityId}
        patientId={patientId}
      />
      <ViewInvestigationSuggestions
        investigations={investigations}
        //investigationSessions={investigationSessions}
        consultationId={consultationId}
        logUrl={
          patientData.is_active
            ? `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigation`
            : undefined
        }
      />
    </>
  );
}
