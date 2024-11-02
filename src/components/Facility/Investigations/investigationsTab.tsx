import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";
import { PatientModel } from "../../Patient/models";
import ViewInvestigationSuggestions from "./InvestigationSuggestions";
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
  const { data: investigations, loading: investigationLoading } = useQuery(
    routes.getInvestigation,
    {
      pathParams: {
        consultation_external_id: consultationId,
      },
    },
  );

  const { data: investigationSessions, loading: investigationSessionLoading } =
    useQuery(routes.getInvestigationSessions, {
      pathParams: {
        consultation_external_id: consultationId,
      },
    });

  return (
    <>
      <ViewInvestigations
        isLoading={investigationLoading || investigationSessionLoading}
        investigations={investigations?.results || []}
        investigationSessions={investigationSessions || []}
        consultationId={consultationId}
        facilityId={facilityId}
        patientId={patientId}
      />
      <ViewInvestigationSuggestions
        investigations={investigations?.results || []}
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
