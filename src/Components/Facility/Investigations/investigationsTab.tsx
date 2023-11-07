import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import { statusType, useAbortableEffect } from "@/Common/utils";
import ViewInvestigationSuggestions from "@/Components/Facility/Investigations/InvestigationSuggestions";
import { InvestigationResponse } from "@/Components/Facility/Investigations/Reports/types";
import ViewInvestigations from "@/Components/Facility/Investigations/ViewInvestigations";
import { PatientModel } from "@/Components/Patient/models";
import { getInvestigation, getInvestigationSessions } from "@/Redux/actions";

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

  const [isLoading, setIsLoading] = useState(false);
  const dispatchAction: any = useDispatch();
  const [investigations, setInvestigations] = useState<InvestigationResponse>(
    []
  );
  const [investigationSessions, setInvestigationSessions] = useState<
    InvestigationSessionType[]
  >([]);

  const fetchInvestigations = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getInvestigation({}, consultationId));
      if (!status.aborted) {
        if (res && res.data) {
          setInvestigations(res.data.results);
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, consultationId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchInvestigations(status);
    },
    [fetchInvestigations]
  );

  const fetchInvestigationSessions = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getInvestigationSessions({}, consultationId)
      );
      if (!status.aborted) {
        if (res && res.data) {
          setInvestigationSessions(res.data.reverse());
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, consultationId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchInvestigationSessions(status);
    },
    [fetchInvestigationSessions]
  );

  return (
    <>
      <ViewInvestigations
        isLoading={isLoading}
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
