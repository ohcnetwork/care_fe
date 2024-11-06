import * as _ from "lodash-es";
import { set } from "lodash-es";
import { useCallback, useReducer } from "react";
import routes from "../../../Redux/api";
import * as Notification from "../../../Utils/Notifications";
import request from "../../../Utils/request/request";
import useQuery from "../../../Utils/request/useQuery";
import InvestigationTable from "./InvestigationTable";
import { useTranslation } from "react-i18next";
import Page from "@/components/Common/components/Page";
import Loading from "@/components/Common/Loading";
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

interface ShowInvestigationProps {
  consultationId: string;
  patientId: string;
  sessionId: string;
  facilityId: string;
}
export default function ShowInvestigation(props: ShowInvestigationProps) {
  const { consultationId, patientId, sessionId, facilityId } = props;
  const { t } = useTranslation();
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
          {},
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
          {},
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
    },
  );

  const { data: consultation } = useQuery(routes.getConsultation, {
    pathParams: { id: consultationId },
    prefetch: !!consultationId,
  });

  const handleValueChange = (value: any, name: string) => {
    const changedFields = { ...state.changedFields };
    set(changedFields, name, value);
    dispatch({ type: "set_changed_fields", changedFields });
  };

  const handleSubmit = async () => {
    const data = Object.values(state.changedFields)
      .filter(
        (field: any) =>
          field?.initialValue !==
          (field?.notes || Number(field?.value) || null),
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
        const changedDict: any = {};
        Object.values(state.changedFields).forEach(
          (field: any) =>
            (changedDict[field.id] = {
              id: field.id,
              value: field?.value || null,
              notes: field?.notes || null,
            }),
        );
        const changedInitialValues: any = {};
        Object.values(state.initialValues).forEach(
          (field: any) =>
            (changedInitialValues[field.id] = {
              ...field,
              value: changedDict[field.id].value,
              notes: changedDict[field.id].notes,
            }),
        );
        dispatch({
          type: "set_initial_values",
          initialValues: changedInitialValues,
        });
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
    <Page
      title={t("investigation_report", {
        name: patientData?.name,
      })}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 rounded bg-white p-6 transition-all sm:rounded-xl sm:p-12">
        <InvestigationTable
          title={t("investigation_report_for_{{name}}", {
            name: patientData?.name,
          })}
          data={state.initialValues}
          isDischargedPatient={!!consultation?.discharge_date}
          changedFields={state.changedFields}
          handleValueChange={handleValueChange}
          handleUpdateCancel={handleUpdateCancel}
          handleSave={handleSubmit}
          consultationId={consultationId}
          patientId={patientId}
          sessionId={sessionId}
          facilityId={facilityId}
        />
      </div>
    </Page>
  );
}
