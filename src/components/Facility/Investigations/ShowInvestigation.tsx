import { useCallback, useReducer } from "react";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import InvestigationTable from "@/components/Facility/Investigations/InvestigationTable";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";

// import { setNestedValueSafely } from "@/Utils/utils";

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
  const { loading: investigationLoading } = useTanStackQueryInstead(
    routes.getInvestigation,
    {
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
          dispatch({
            type: "set_changed_fields",
            changedFields: changedValues,
          });
        }
      },
    },
  );

  const { data: patientData, loading: patientLoading } =
    useTanStackQueryInstead(routes.getPatient, {
      pathParams: { id: patientId },
    });

  const { data: consultation } = useTanStackQueryInstead(
    routes.getConsultation,
    {
      pathParams: { id: consultationId },
      prefetch: !!consultationId,
    },
  );

  const handleValueChange = (value: any, name: string) => {
    const keys = name.split(".");
    // Validate keys to prevent prototype pollution - coderabbit suggested
    if (
      keys.some((key) =>
        ["__proto__", "constructor", "prototype"].includes(key),
      )
    ) {
      return;
    }

    const changedFields = { ...state.changedFields };
    let current = changedFields;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
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
    const changedValues = Object.keys(state.initialValues).reduce(
      (acc: any, key: any) => {
        const val = state.initialValues[key];
        acc[key] = {
          id: val?.id,
          initialValue: val?.notes || val?.value || null,
          value: val?.value || null,
          notes: val?.notes || null,
        };
        return acc;
      },
      {},
    );
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
