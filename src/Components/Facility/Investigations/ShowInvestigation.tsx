import React, { useCallback, useReducer, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { getInvestigation } from "../../../Redux/actions";
import PageTitle from "../../Common/PageTitle";
import InvestigationTable from "./InvestigationTable";
import loadable from "@loadable/component";
import _ from "lodash";
const Loading = loadable(() => import("../../Common/Loading"));

const initialState = {
  form: {},
};

const updateFormReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    default:
      return state;
  }
};

export default function ShowInvestigation(props: any) {
  const [isLoading, setIsLoading] = useState(false);
  const { consultationId, sessionId }: any = props;
  const dispatchAction: any = useDispatch();
  // const [investigationData, setInvestigationData] = useState([]);
  const [state, dispatch] = useReducer(updateFormReducer, initialState);
  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getInvestigation({ session: sessionId }, consultationId)
      );
      if (!status.aborted) {
        if (res && res?.data?.results) {
          const valueMap = res.data.results.reduce(
            (acc: any, cur: { id: any }) => ({ ...acc, [cur.id]: cur }),
            {}
          );
          dispatch({ type: "set_form", form: valueMap });
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatchAction, sessionId]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );
  const handleValueChange = (value: any, name: string) => {
    const form = { ...state.form };
    _.set(form, name, value);
    dispatch({ type: "set_form", form });
  };

  const handleSubmit = () => {};
  // console.log(state.form);
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
          data={state.form}
          handleValueChange={handleValueChange}
        />
      )}
    </div>
  );
}
