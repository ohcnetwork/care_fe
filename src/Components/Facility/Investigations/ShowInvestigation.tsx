import _, { set } from "lodash-es";
import { navigate } from "raviger";
import { lazy, useCallback, useReducer } from "react";
import { useTranslation } from "react-i18next";
import routes from "../../../Redux/api";
import * as Notification from "../../../Utils/Notifications.js";
import request from "../../../Utils/request/request";
import useQuery from "../../../Utils/request/useQuery";
import PageTitle from "../../Common/PageTitle";
import InvestigationTable from "./InvestigationTable";

const Loading = lazy(() => import("../../Common/Loading"));

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
  const { t } = useTranslation();
  const { consultationId, patientId, facilityId, sessionId } = props;

  const [state, dispatch] = useReducer(updateFormReducer, initialState);
  const { loading: investigationLoading } = useQuery(routes.getInvestigation, {
    pathParams: {
      consultation_external_id: consultationId,
    },
    query: {
      session: sessionId,
    },
    onResponse: (res) => {
      if (res && res.data) {
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
        dispatch({ type: "set_changed_fields", changedFields: changedValues });
      }
    },
  });

  const { data: patientData, loading: patientLoading } = useQuery(
    routes.getPatient,
    {
      pathParams: { id: patientId },
    }
  );

  const handleValueChange = (value: any, name: string) => {
    const changedFields = { ...state.changedFields };
    set(changedFields, name, value);
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
      const { res } = await request(routes.editInvestigation, {
        pathParams: { consultation_external_id: consultationId },
        body: { investigations: data },
      });
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

  if (patientLoading || investigationLoading) {
    return <Loading />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      <PageTitle
        title={t("investigations")}
        className="mx-3 md:mx-4"
        crumbsReplacements={{
          [facilityId]: { name: patientData?.facility_object?.name },
          [patientId]: { name: patientData?.name },
        }}
        backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`}
      />
      <InvestigationTable
        title={`ID: ${sessionId}`}
        data={state.initialValues}
        changedFields={state.changedFields}
        handleValueChange={handleValueChange}
        handleUpdateCancel={handleUpdateCancel}
        handleSave={handleSubmit}
      />
    </div>
  );
}
