import { navigate } from "raviger";
import dayjs from "dayjs";
import { lazy, useCallback, useState } from "react";
import {
  CONSCIOUSNESS_LEVEL,
  PATIENT_CATEGORIES,
  REVIEW_AT_CHOICES,
  RHYTHM_CHOICES,
  TELEMEDICINE_ACTIONS,
} from "../../Common/constants";
import useAppHistory from "../../Common/hooks/useAppHistory";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { DraftSection, useAutoSaveReducer } from "../../Utils/AutoSave";
import * as Notification from "../../Utils/Notifications";
import { formatDateTime } from "../../Utils/utils";
import BloodPressureFormField, {
  BloodPressureValidator,
} from "../Common/BloodPressureFormField";
import { SymptomsSelect } from "../Common/SymptomsSelect";
import TemperatureFormField from "../Common/TemperatureFormField";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import RangeAutocompleteFormField from "../Form/FormFields/RangeAutocompleteFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import PatientCategorySelect from "./PatientCategorySelect";
import RadioFormField from "../Form/FormFields/RadioFormField";
import routes from "../../Redux/api";
import request from "../../Utils/request/request";
import { DailyRoundsModel } from "./models";
const Loading = lazy(() => import("../Common/Loading"));

const initForm: any = {
  additional_symptoms: [],
  other_symptoms: "",
  physical_examination_info: "",
  other_details: "",
  patient_category: "",
  current_health: 0,
  actions: null,
  action: "",
  review_interval: 0,
  admitted_to: "",
  taken_at: null,
  rounds_type: "NORMAL",
  clone_last: false,
  systolic: null,
  diastolic: null,
  pulse: null,
  resp: null,
  temperature: null,
  rhythm: "0",
  rhythm_detail: "",
  ventilator_spo2: null,
  consciousness_level: "UNKNOWN",
  bp: {
    systolic: undefined,
    diastolic: undefined,
    mean: undefined,
  },
  // bed: null,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const DailyRoundsFormReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    case "set_errors": {
      return {
        ...state,
        errors: action.errors,
      };
    }
    case "set_state": {
      if (action.state) return action.state;
      return state;
    }
    default:
      return state;
  }
};

export const DailyRounds = (props: any) => {
  const { goBack } = useAppHistory();
  const { facilityId, patientId, consultationId, id } = props;
  const [state, dispatch] = useAutoSaveReducer<any>(
    DailyRoundsFormReducer,
    initialState
  );
  const [isLoading, setIsLoading] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [consultationSuggestion, setConsultationSuggestion] = useState<any>("");
  const [prevReviewInterval, setPreviousReviewInterval] = useState(-1);
  const [prevAction, setPreviousAction] = useState("NO_ACTION");
  const [hasPreviousLog, setHasPreviousLog] = useState(false);
  const [initialData, setInitialData] = useState<any>({
    ...initForm,
    action: "",
  });
  const headerText = !id ? "Add Consultation Update" : "Info";
  const buttonText = !id ? "Save" : "Continue";

  const formFields = [
    "physical_examination_info",
    "other_details",
    "additional_symptoms",
    "action",
    "review_interval",
    "bp",
    "pulse",
    "resp",
    "ventilator_spo2",
    "rhythm",
    "rhythm_detail",
    "consciousness_level",
  ];
  const fetchRoundDetails = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      let formData: any = initialData;
      if (id) {
        const { data } = await request(routes.getDailyReport, {
          pathParams: {
            consultationId,
            id,
          },
        });

        if (!status.aborted) {
          if (data) {
            const tdata = {
              ...data,
              patient_category: data.patient_category
                ? PATIENT_CATEGORIES.find(
                    (i) => i.text === data.patient_category
                  )?.id ?? ""
                : "",
              rhythm:
                (data.rhythm &&
                  RHYTHM_CHOICES.find((i) => i.text === data.rhythm)?.id) ||
                "0",
              admitted_to: data.admitted_to ?? "Select",
            };
            formData = { ...formData, ...tdata };
          }
        }
      }
      setIsLoading(false);
      if (patientId) {
        const { data: patientData } = await request(routes.getPatient, {
          pathParams: {
            id: patientId,
          },
        });
        if (patientData) {
          setPatientName(patientData.name);
          setFacilityName(patientData.facility_object.name);
          setConsultationSuggestion(patientData.last_consultation?.suggestion);
          setPreviousReviewInterval(
            Number(patientData.last_consultation?.review_interval)
          );
          const getAction =
            TELEMEDICINE_ACTIONS.find(
              (action) => action.id === patientData.action
            )?.text || "NO_ACTION";
          setPreviousAction(getAction);
          setInitialData({
            ...initialData,
            action: getAction,
          });
          formData = { ...formData, ...{ action: getAction } };
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
      if (consultationId && !id) {
        const { data: dailyReportsData } = await request(
          routes.getDailyReports,
          {
            pathParams: {
              consultationId,
            },
            query: {
              limit: 1,
              offset: 0,
            },
          }
        );
        setHasPreviousLog(
          (dailyReportsData && dailyReportsData?.count > 0) || false
        );
        formData = {
          ...formData,
          ...{
            patient_category: dailyReportsData?.results[0].patient_category
              ? PATIENT_CATEGORIES.find(
                  (i) =>
                    i.text === dailyReportsData?.results[0].patient_category
                )?.id ?? ""
              : "",

            rhythm:
              (dailyReportsData?.results[0].rhythm &&
                RHYTHM_CHOICES.find(
                  (i) => i.text === dailyReportsData?.results[0].rhythm
                )?.id) ||
              "0",
            temperature: dailyReportsData?.results[0].temperature
              ? parseFloat(dailyReportsData?.results[0].temperature)
              : null,
          },
        };
      }
      dispatch({ type: "set_form", form: formData });
      setInitialData(formData);
    },
    [consultationId, id, patientId]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchRoundDetails(status);
    },
    [fetchRoundDetails]
  );

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "patient_category":
          if (!state.form[field]) {
            errors[field] = "Please select a category";
            invalidForm = true;
          }
          return;
        case "other_symptoms":
          if (
            state.form.additional_symptoms?.includes(9) &&
            !state.form[field]
          ) {
            errors[field] = "Please enter the other symptom details";
            invalidForm = true;
          }
          return;
        case "bp": {
          const error = BloodPressureValidator(state.form.bp);
          if (error) {
            errors.bp = error;
            invalidForm = true;
          }
          return;
        }
        default:
          return;
      }
    });
    dispatch({ type: "set_errors", errors });
    return !invalidForm;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      setIsLoading(true);
      const baseData = {
        clone_last: state.form.clone_last ?? false,
        rounds_type: state.form.rounds_type,
        patient_category: state.form.patient_category,
        taken_at: state.form.taken_at
          ? state.form.taken_at
          : new Date().toISOString(),
      };

      let data: any;

      if (state.form.clone_last !== true) {
        data = {
          ...baseData,
          additional_symptoms: state.form.additional_symptoms,
          other_symptoms: state.form.additional_symptoms?.includes(9)
            ? state.form.other_symptoms
            : undefined,
          admitted_to:
            (state.form.admitted === "Select"
              ? undefined
              : state.form.admitted_to) || undefined,
          physical_examination_info: state.form.physical_examination_info,
          other_details: state.form.other_details,
          consultation: consultationId,
          action: prevAction,
          review_interval: Number(prevReviewInterval),
        };
        if (["NORMAL", "TELEMEDICINE"].includes(state.form.rounds_type)) {
          data = {
            ...data,
            bp: state.form.bp ?? {},
            pulse: state.form.pulse ?? null,
            resp: state.form.resp ?? null,
            temperature: state.form.temperature ?? null,
            rhythm: state.form.rhythm || 0,
            rhythm_detail: state.form.rhythm_detail,
            ventilator_spo2: state.form.ventilator_spo2 ?? null,
            consciousness_level: state.form.consciousness_level,
          };
        }
      } else {
        data = baseData;
      }

      let res,
        dailyRoundsData: DailyRoundsModel | undefined = undefined;

      if (id) {
        const { res: tres, data: tData } = await request(
          routes.updateDailyReport,
          {
            pathParams: {
              consultationId,
              id,
            },
            body: data,
          }
        );

        res = tres;
        dailyRoundsData = tData;
      } else {
        const { res: tres, data: tData } = await request(
          routes.createDailyRounds,
          {
            pathParams: {
              consultationId,
            },
            body: data,
          }
        );
        res = tres;
        dailyRoundsData = tData;
      }

      setIsLoading(false);
      if (res?.ok && dailyRoundsData) {
        dispatch({ type: "set_form", form: initForm });

        if (id) {
          Notification.Success({
            msg: "Consultation Updates details updated successfully",
          });
          if (["NORMAL", "TELEMEDICINE"].includes(state.form.rounds_type)) {
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
            );
          } else {
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${dailyRoundsData?.external_id}/update`
            );
          }
        } else {
          Notification.Success({
            msg: "Consultation Updates details created successfully",
          });
          if (["NORMAL", "TELEMEDICINE"].includes(state.form.rounds_type)) {
            if (data.clone_last) {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${dailyRoundsData?.external_id}/update`
              );
            } else {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
              );
            }
          } else {
            if (data.clone_last) {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${dailyRoundsData?.external_id}/update`
              );
            } else {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${dailyRoundsData?.external_id}/update`
              );
            }
          }
        }
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleFormFieldChange = (event: FieldChangeEvent<unknown>) => {
    dispatch({
      type: "set_form",
      form: { ...state.form, [event.name]: event.value },
    });
  };

  const field = (name: string) => {
    return {
      id: name,
      name,
      value: state.form[name],
      error: state.errors[name],
      onChange: handleFormFieldChange,
    };
  };

  const getExpectedReviewTime = () => {
    const nextReviewTime = Number(
      state.form.review_interval || prevReviewInterval
    );
    if (nextReviewTime > 0)
      return formatDateTime(dayjs().add(nextReviewTime, "minutes").toDate());
    return "No Reviews Planned!";
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Page
      title={headerText}
      crumbsReplacements={{
        [facilityId]: { name: facilityName },
        [patientId]: { name: patientName },
      }}
      backUrl={
        id
          ? `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds`
          : `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
      }
      className="mx-auto max-w-4xl"
    >
      <form
        onSubmit={(e) => handleSubmit(e)}
        className="w-full max-w-4xl rounded-lg bg-white px-8 py-5 shadow md:m-4 md:px-16 md:py-11"
      >
        <DraftSection
          handleDraftSelect={(newState) => {
            dispatch({ type: "set_state", state: newState });
          }}
          formData={state.form}
        />
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="w-full md:w-1/3">
            <TextFormField
              {...field("taken_at")}
              required
              className="w-full"
              label="Measured at"
              type="datetime-local"
              value={dayjs(state.form.taken_at || undefined).format(
                "YYYY-MM-DDTHH:mm"
              )}
              max={dayjs().format("YYYY-MM-DDTHH:mm")}
            />
          </div>
          <div className="w-full md:w-1/3">
            <SelectFormField
              {...field("rounds_type")}
              required
              className="w-full"
              label="Round Type"
              options={[
                ...[
                  { id: "NORMAL", text: "Normal" },
                  { id: "VENTILATOR", text: "Critical Care" },
                ],
                ...(consultationSuggestion == "DC"
                  ? [{ id: "TELEMEDICINE", text: "Telemedicine" }]
                  : []),
              ]}
              optionLabel={(option) => option.text}
              optionValue={(option) => option.id}
            />
          </div>
          <div className="w-full md:w-1/3">
            <PatientCategorySelect
              {...field("patient_category")}
              required
              label="Category"
            />
          </div>
        </div>

        {!id && hasPreviousLog && (
          <CheckBoxFormField
            {...field("clone_last")}
            label="Copy values from previous log?"
          />
        )}

        {(!state.form.clone_last || id) && (
          <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
            <TextAreaFormField
              {...field("physical_examination_info")}
              label="Physical Examination Info"
              rows={5}
            />
            <TextAreaFormField
              {...field("other_details")}
              label="Other Details"
              rows={5}
            />
            <SymptomsSelect
              {...field("additional_symptoms")}
              label="Symptoms"
              className="md:col-span-2"
            />

            {state.form.additional_symptoms?.includes(9) && (
              <div className="md:col-span-2">
                <TextAreaFormField
                  {...field("other_symptoms")}
                  required
                  label="Other Symptoms Details"
                  placeholder="Enter the other symptoms here"
                />
              </div>
            )}

            <SelectFormField
              {...field("action")}
              label="Action"
              options={TELEMEDICINE_ACTIONS}
              optionLabel={(option) => option.desc}
              optionValue={(option) => option.text}
              value={prevAction}
              onChange={(event) => {
                handleFormFieldChange(event);
                setPreviousAction(event.value);
              }}
            />

            <SelectFormField
              {...field("review_interval")}
              label="Review After"
              labelSuffix={getExpectedReviewTime()}
              options={REVIEW_AT_CHOICES}
              optionLabel={(option) => option.text}
              optionValue={(option) => option.id}
              value={prevReviewInterval}
              onChange={(event) => {
                handleFormFieldChange(event);
                setPreviousReviewInterval(Number(event.value));
              }}
            />

            {["NORMAL", "TELEMEDICINE"].includes(state.form.rounds_type) && (
              <>
                <h3 className="mb-6 md:col-span-2">Vitals</h3>

                <BloodPressureFormField
                  {...field("bp")}
                  label="Blood Pressure"
                />

                <RangeAutocompleteFormField
                  {...field("pulse")}
                  label="Pulse"
                  unit="bpm"
                  start={0}
                  end={200}
                  step={1}
                  thresholds={[
                    {
                      value: 0,
                      className: "text-danger-500",
                      label: "Bradycardia",
                    },
                    {
                      value: 40,
                      className: "text-primary-500",
                      label: "Normal",
                    },
                    {
                      value: 100,
                      className: "text-danger-500",
                      label: "Tachycardia",
                    },
                  ]}
                />

                <TemperatureFormField
                  {...field("temperature")}
                  label="Temperature"
                />

                <RangeAutocompleteFormField
                  {...field("resp")}
                  label="Respiratory Rate"
                  unit="bpm"
                  start={0}
                  end={150}
                  step={1}
                  thresholds={[
                    {
                      value: 0,
                      className: "text-danger-500",
                      label: "Bradypnea",
                    },
                    {
                      value: 12,
                      className: "text-primary-500",
                      label: "Normal",
                    },
                    {
                      value: 16,
                      className: "text-danger-500",
                      label: "Tachypnea",
                    },
                  ]}
                />

                <RangeAutocompleteFormField
                  {...field("ventilator_spo2")}
                  label="SPO2"
                  unit="%"
                  start={0}
                  end={100}
                  step={1}
                  thresholds={[
                    {
                      value: 0,
                      className: "text-danger-500",
                      label: "Low",
                    },
                    {
                      value: 90,
                      className: "text-primary-500",
                      label: "Normal",
                    },
                    {
                      value: 100,
                      className: "text-danger-500",
                      label: "High",
                    },
                  ]}
                />

                <SelectFormField
                  {...field("rhythm")}
                  label="Rhythm"
                  options={RHYTHM_CHOICES}
                  optionLabel={(option) => option.desc}
                  optionValue={(option) => option.id}
                />

                <TextAreaFormField
                  {...field("rhythm_detail")}
                  className="md:col-span-1"
                  label="Rhythm Description"
                  rows={7}
                />

                <RadioFormField
                  label="Level Of Consciousness"
                  {...field("consciousness_level")}
                  options={CONSCIOUSNESS_LEVEL.map((level) => ({
                    label: level.text,
                    value: level.id,
                  }))}
                  optionDisplay={(option) => option.label}
                  optionValue={(option) => option.value}
                  containerClassName="grid gap-1 grid-cols-1"
                />
              </>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
          <Cancel onClick={() => goBack()} />
          <Submit
            disabled={
              buttonText === "Save" &&
              state.form.clone_last !== null &&
              !state.form.clone_last &&
              formFields.every(
                (field: string) => state.form[field] == initialData[field]
              ) &&
              (state.form.temperature == initialData.temperature ||
                isNaN(state.form.temperature)) &&
              state.form.rounds_type !== "VENTILATOR"
            }
            onClick={(e) => handleSubmit(e)}
            label={buttonText}
          />
        </div>
      </form>
    </Page>
  );
};
