import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { getInvestigationSessions } from "../../../Redux/actions";
import PageTitle from "../../Common/PageTitle";
import moment from "moment";
import { navigate } from "raviger";
import loadable from "@loadable/component";
const Loading = loadable(() => import("../../Common/Loading"));

export default function ViewInvestigations(props: any) {
  const [isLoading, setIsLoading] = useState(false);
  const { facilityId, patientId, consultationId }: any = props;
  const dispatchAction: any = useDispatch();
  const [investigationData, setInvestigationData] = useState([]);
  interface InvestigationType {
    session_external_id: string;
    session_created_date: string;
  }

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getInvestigationSessions({}, consultationId)
      );
      if (!status.aborted) {
        if (res && res.data) {
          setInvestigationData(res.data.reverse());
        }
        setIsLoading(false);
      }
    },
    [dispatchAction]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  return (
    <div className="max-w-7xl mx-auto px-4">
      <PageTitle
        title="View Investigations"
        hideBack={false}
        className="mx-3 md:mx-8"
      />
      {isLoading ? (
        <Loading />
      ) : (
        <div className="mt-4 space-y-2 ">
          {investigationData.map((data: InvestigationType) => {
            return (
              <div className="flex justify-between items-center bg-white hover:bg-gray-200 cursor-pointer p-4 border rounded-lg shadow">
                <div>{moment(data.session_created_date).format("lll")}</div>
                <button
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/investigation/${data.session_external_id}`
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
