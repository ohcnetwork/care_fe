import _, { set } from "lodash-es";
import { navigate } from "raviger";
import { lazy, useCallback, useReducer } from "react";
import { useTranslation } from "react-i18next";
import routes from "../../../Redux/api";
import * as Notification from "../../../Utils/Notifications.js";
import request from "../../../Utils/request/request";
import useQuery from "../../../Utils/request/useQuery";
import InvestigationTable from "./InvestigationTable";
import PrintPreview from "../../../CAREUI/misc/PrintPreview";
import { PatientDetail } from "../../Common/components/PatientDetail";
import { formatDate, formatDateTime, formatName, patientAgeInYears } from "../../../Utils/utils";
import useConfig from "../../../Common/hooks/useConfig";

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
  const { main_logo } = useConfig();
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
        navigate(
          `/facility/${props.facilityId}/patient/${props.patientId}/consultation/${props.consultationId}`,
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
          <PrintPreview title={`Investigation Report for ${patientData?.name}`}
          >
        <div id="section-to-print">
          
          <div
          className="print:w-[1100px]">

         
        <div className="mb-3 flex items-center justify-between p-4 ">
          <h3>{consultation?.facility_name}</h3>
          <img className="h-10 w-auto" src={main_logo.dark} alt="care logo" />
        </div>
        <div className="mb-6 grid grid-cols-8 gap-y-1.5 border-2 border-secondary-400 p-2">
          <PatientDetail name="Patient" className="col-span-5">
            {patientData && (
              <>
                <span className="uppercase">{patientData.name}</span> -{" "}
                {t(`GENDER__${patientData.gender}`)},{" "}
                {patientAgeInYears(patientData).toString()}yrs
              </>
            )}
          </PatientDetail>
          <PatientDetail name="IP/OP No." className="col-span-3">
            {consultation?.patient_no}
          </PatientDetail>

          <PatientDetail
            name={
              consultation
                ? `${t(`encounter_suggestion__${consultation?.suggestion}`)} on`
                : ""
            }
            className="col-span-5"
          >
            {formatDate(consultation?.encounter_date)}
          </PatientDetail>
          <PatientDetail name="Bed" className="col-span-3">
            {consultation?.current_bed?.bed_object.location_object?.name}
            {" - "}
            {consultation?.current_bed?.bed_object.name}
          </PatientDetail>
        </div>
        </div>
        <InvestigationTable
            title={`Investigation Report of :${patientData?.name}`}
            data={state.initialValues}
            isDischargedPatient={!!consultation?.discharge_date}
            changedFields={state.changedFields}
            handleValueChange={handleValueChange}
            handleUpdateCancel={handleUpdateCancel}
            handleSave={handleSubmit}
          />        
        <div className="pt-12">
        <p className="font-medium text-secondary-800">
          Sign of the Consulting Doctor
        </p>
        <PatientDetail name="Name of the Consulting Doctor">
          {consultation?.treating_physician_object &&
            formatName(consultation?.treating_physician_object)}
        </PatientDetail>
        <p className="pt-6 text-center text-xs font-medium text-secondary-700">
          Generated on: {formatDateTime(new Date())}
        </p>
        <p className="pt-1 text-center text-xs font-medium text-secondary-700">
          This is a computer generated prescription. It shall be issued to the
          patient only after the concerned doctor has verified the content and
          authorized the same by affixing signature.
        </p>
      </div>  
      </div>

      </PrintPreview>
  );
}
