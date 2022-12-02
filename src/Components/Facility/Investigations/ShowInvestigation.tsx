import React, { useCallback, useReducer, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import {
  editInvestigation,
  getInvestigation,
  getPatient,
} from "../../../Redux/actions";
import PageTitle from "../../Common/PageTitle";
import InvestigationTable from "./InvestigationTable";
import loadable from "@loadable/component";
import _ from "lodash";
import { navigate } from "raviger";
import * as Notification from "../../../Utils/Notifications.js";

const Loading = loadable(() => import("../../Common/Loading"));

const initialState = {
  changedFields: {},
  initialValues: {},
};

const updateFormReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_changed_fields": {
      return {
        ...state,
        changedFields: action.changedFields,
      };
    }
    case "set_initial_values": {
      return {
        ...state,
        initialValues: action.initialValues,
      };
    }
    default:
      return state;
  }
};

export default function ShowInvestigation(props: any) {
  const { consultationId, patientId, facilityId, sessionId } = props;

  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [state, dispatch] = useReducer(updateFormReducer, initialState);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");

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

          const changedValues = res.data.results.reduce(
            (acc: any, cur: any) => ({
              ...acc,
              [cur.id]: {
                id: cur?.id,
                initialValue: cur?.notes || cur?.value || null,
                value: cur?.value || null,
                notes: cur?.notes || null,
              },
            }),
            {}
          );

          dispatch({ type: "set_initial_values", initialValues: valueMap });
          dispatch({
            type: "set_changed_fields",
            changedFields: changedValues,
          });
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

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatchAction(getPatient({ id: patientId }));
        if (res.data) {
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
    }
    fetchPatientName();
  }, [dispatchAction, patientId]);

  const handleValueChange = (value: any, name: string) => {
    const changedFields = { ...state.changedFields };
    _.set(changedFields, name, value);
    dispatch({ type: "set_changed_fields", changedFields });
  };

  const handleSubmit = async () => {
    const data = Object.values(state.changedFields)
      .filter(
        (field: any) =>
          field?.initialValue !== (field?.notes || Number(field?.value) || null)
      )
      .map((field: any) => ({
        external_id: field?.id,
        value: field?.value,
        notes: field?.notes,
      }));

    if (data.length) {
      const res = await dispatchAction(
        editInvestigation({ investigations: data }, consultationId)
      );
      if (res && res.status === 204) {
        Notification.Success({
          msg: "Investigation Updated successfully!",
        });
        navigate(
          `/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}`
        );
      }
      return;
    } else {
      Notification.Error({
        msg: "Update at least 1 investigation!",
      });
    }
  };

  const handleUpdateCancel = useCallback(() => {
    const changedValues = _.chain(state.initialValues)
      .map((val: any, _key: string) => ({
        id: val?.id,
        initialValue: val?.notes || val?.value || null,
        value: val?.value || null,
        notes: val?.notes || null,
      }))
      .reduce((acc: any, cur: any) => ({ ...acc, [cur.id]: cur }), {})
      .value();
    dispatch({ type: "set_changed_fields", changedFields: changedValues });
  }, [state.initialValues]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <PageTitle
        title="Investigation"
        className="mx-3 md:mx-4"
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [patientId]: { name: patientName },
        }}
      />
      {isLoading ? (
        <Loading />
      ) : (
        <InvestigationTable
          title={`ID: ${sessionId}`}
          data={state.initialValues}
          changedFields={state.changedFields}
          handleValueChange={handleValueChange}
          handleUpdateCancel={handleUpdateCancel}
          handleSave={handleSubmit}
        />
      )}
    </div>
  );
}
