import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import {
  getInvestigationSessions,
  getInvestigation,
} from "../../../Redux/actions";
import moment from "moment";
import { navigate } from "raviger";
import ReportTable from "./Reports/ReportTable";
import { InvestigationResponse } from "./Reports/types";
import loadable from "@loadable/component";
const Loading = loadable(() => import("../../Common/Loading"));

interface InvestigationSessionType {
  session_external_id: string;
  session_created_date: string;
}

export default function ViewInvestigations(props: any) {
  const [isLoading, setIsLoading] = useState(false);
  const { facilityId, patientId, consultationId }: any = props;
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
    <div className="max-w-7xl mx-auto">
      {isLoading ? (
        <Loading />
      ) : (
        <div className="mt-4 space-y-2 ">
          {investigations.length > 0 && (
            <div>
              <h4 className="text-gray-700 -mb-14">Summary</h4>
              <ReportTable
                investigationData={investigations}
                hidePrint={true}
              />
            </div>
          )}
          {investigationSessions.length === 0 && (
            <div className="text-lg h-full text-center mt-5 text-gray-500 text-semibold bg-white py-4 rounded-lg shadow">
              No Investigation Reports Found
            </div>
          )}
          {investigationSessions.map((investigationSession) => {
            return (
              <div
                key={investigationSession.session_external_id}
                className="flex justify-between items-center bg-white hover:bg-gray-200 cursor-pointer p-4 border rounded-lg shadow"
              >
                <div>
                  {moment(investigationSession.session_created_date).format(
                    "lll"
                  )}
                </div>
                <button
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigation/${investigationSession.session_external_id}`
                    )
                  }
                  className="btn btn-default"
                >
                  View
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
