import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { getInvestigationSessions } from "../../../Redux/actions";
import PageTitle from "../../Common/PageTitle";

export default function ViewInvestigations(props: any) {
  const [isLoading, setIsLoading] = useState(false);
  const { consultationId }: any = props;
  const dispatchAction: any = useDispatch();

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getInvestigationSessions(consultationId)
      );
      if (!status.aborted) {
        if (res && res.data) {
          console.log(res.data);
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
    <div>
      <PageTitle
        title="View Investigations"
        hideBack={false}
        className="mx-3 md:mx-8"
      />
    </div>
  );
}
