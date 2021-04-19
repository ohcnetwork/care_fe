import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { getInvestigation } from "../../../Redux/actions";
import PageTitle from "../../Common/PageTitle";
import InvestigationTable from "./InvestigationTable";
import loadable from "@loadable/component";
const Loading = loadable(() => import("../../Common/Loading"));

export default function ShowInvestigation(props: any) {
  const [isLoading, setIsLoading] = useState(false);
  const { consultationId, sessionId }: any = props;
  const dispatchAction: any = useDispatch();
  const [investigationData, setInvestigationData] = useState([]);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getInvestigation({ session: sessionId }, consultationId)
      );
      if (!status.aborted) {
        if (res && res.data) {
          setInvestigationData(res.data.results);
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
        title="Investigation"
        hideBack={false}
        className="mx-3 md:mx-8"
      />
      {isLoading ? (
        <Loading />
      ) : (
        <InvestigationTable
          title={`ID: ${sessionId}`}
          data={investigationData}
        />
      )}
    </div>
  );
}
