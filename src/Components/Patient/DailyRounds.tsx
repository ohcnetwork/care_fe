import { navigate } from "raviger";

import { useCallback, useState, useEffect, lazy } from "react";
import { useDispatch } from "react-redux";
import {
  TELEMEDICINE_ACTIONS,
  REVIEW_AT_CHOICES,
  RHYTHM_CHOICES,
  PATIENT_CATEGORIES,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createDailyReport,
  getConsultationDailyRoundsDetails,
  getDailyReport,
  updateDailyReport,
  getPatient,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import { formatDateTime } from "../../Utils/utils";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import useAppHistory from "../../Common/hooks/useAppHistory";
import { DraftSection, useAutoSaveReducer } from "../../Utils/AutoSave";
import Page from "../Common/components/Page";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import TextFormField from "../Form/FormFields/TextFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import PatientCategorySelect from "./PatientCategorySelect";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import { SymptomsSelect } from "../Common/SymptomsSelect";
import RangeAutocompleteFormField from "../Form/FormFields/RangeAutocompleteFormField";
import BloodPressureFormField, {
  meanArterialPressure,
} from "../Common/BloodPressureFormField";
import TemperatureFormField from "../Common/TemperatureFormField";
import dayjs from "dayjs";
const Loading = lazy(() => import("../Common/Loading"));

const initForm: any = {
  additional_symptoms: [],
  other_symptoms: "",
  physical_examination_info: "",
  other_details: "",
  patient_category: "Comfort",
  current_health: 0,
  recommend_discharge: false,
  action: null,
  review_interval: 0,
  admitted_to: "",
  taken_at: null,
  rounds_type: "NORMAL",
  clone_last: null,
  systolic: null,
  diastolic: null,
  pulse: null,
  resp: null,
  temperature: null,
  rhythm: "0",
  rhythm_detail: "",
  ventilator_spo2: null,
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
  const dispatchAction: any = useDispatch();
  const { facilityId, patientId, consultationId, id } = props;
  const [state, dispatch] = useAutoSaveReducer<any>(
    DailyRoundsFormReducer,
    initialState
  );
  const [isLoading, setIsLoading] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [prevReviewInterval, setPreviousReviewInterval] = useState(-1);
  const [prevAction, setPreviousAction] = useState("NO_ACTION");
  const [hasPreviousLog, setHasPreviousLog] = useState(false);
  const headerText = !id ? "Add Consultation Update" : "Info";
  const buttonText = !id ? "Save" : "Continue";

  useEffect(() => {
    (async () => {
      if (patientId) {
        const res = await dispatchAction(getPatient({ id: patientId }));
        if (res.data) {
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
          setPreviousReviewInterval(
            Number(res.data.last_consultation.review_interval)
          );
          setPreviousAction(
            TELEMEDICINE_ACTIONS.find((action) => action.id === res.data.action)
              ?.text || "NO_ACTION"
          );
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
    })();
  }, [dispatchAction, patientId]);

  const fetchRoundDetails = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(
        getConsultationDailyRoundsDetails({ consultationId, id })
      );

      if (!status.aborted) {
        if (res && res.data) {
          const data = {
            ...res.data,
            patient_category: res.data.patient_category
              ? PATIENT_CATEGORIES.find(
                  (i) => i.text === res.data.patient_category
                )?.id || "Comfort"
              : "Comfort",
            rhythm:
              (res.data.rhythm &&
                RHYTHM_CHOICES.find((i) => i.text === res.data.rhythm)?.id) ||
              "0",
            admitted_to: res.data.admitted_to ? res.data.admitted_to : "Select",
          };
          dispatch({ type: "set_form", form: data });
        }
        setIsLoading(false);
      }
    },
    [consultationId, id, dispatchAction]
  );
  useAbortableEffect(
    (status: statusType) => {
      if (id) {
        fetchRoundDetails(status);
      }
    },
    [dispatchAction, fetchRoundDetails]
  );

  useEffect(() => {
    (async () => {
      if (consultationId && !id) {
        const res = await dispatchAction(
          getDailyReport({ limit: 1, offset: 0 }, { consultationId })
        );
        setHasPreviousLog(res.data.count > 0);
        dispatch({
          type: "set_form",
          form: {
            ...state.form,
            patient_category: res.data.patient_category
              ? PATIENT_CATEGORIES.find(
                  (i) => i.text === res.data.patient_category
                )?.id || "Comfort"
              : "Comfort",
            rhythm:
              (res.data.rhythm &&
                RHYTHM_CHOICES.find((i) => i.text === res.data.rhythm)?.id) ||
              "0",
            temperature: parseFloat(res.data.temperature),
            clone_last: res.data.count > 0 ? true : false,
          },
        });
      }
    })();
  }, [dispatchAction, consultationId, id]);

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;
    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "other_symptoms":
          if (
            state.form.additional_symptoms?.includes(9) &&
            !state.form[field]
          ) {
            errors[field] = "Please enter the other symptom details";
            invalidForm = true;
          }
          return;
        case "clone_last":
          if (state.form.clone_last === null) {
            errors[field] = "Please choose a value";
            invalidForm = true;
          }
          return;
        case "resp":
          if (
            state.form.resp === null &&
            state.form.rounds_type === "NORMAL" &&
            state.form.clone_last !== true
          ) {
            errors[field] = "Please enter a respiratory rate";
            invalidForm = true;
          }
          return;
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
        clone_last: state.form.clone_last,
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
          recommend_discharge: JSON.parse(state.form.recommend_discharge),
          action: prevAction,
          review_interval: Number(prevReviewInterval),
        };
        if (state.form.rounds_type === "NORMAL") {
          data = {
            ...data,
            bp:
              state.form.bp && state.form.bp.systolic && state.form.bp.diastolic
                ? {
                    systolic: Number(state.form.bp.systolic),
                    diastolic: Number(state.form.bp.diastolic),
                    mean: parseFloat(
                      meanArterialPressure(state.form.bp).toFixed(2)
                    ),
                  }
                : undefined,
            pulse: state.form.pulse,
            resp: Number(state.form.resp),
            temperature: state.form.temperature,
            rhythm: Number(state.form.rhythm) || 0,
            rhythm_detail: state.form.rhythm_detail,
            ventilator_spo2: state.form.ventilator_spo2,
          };
        }
      } else {
        data = baseData;
      }

      let res;
      if (id) {
        res = await dispatchAction(
          updateDailyReport(data, { consultationId, id })
        );
      } else {
        res = await dispatchAction(createDailyReport(data, { consultationId }));
      }

      setIsLoading(false);
      if (res && res.data && (res.status === 201 || res.status === 200)) {
        dispatch({ type: "set_form", form: initForm });

        if (id) {
          Notification.Success({
            msg: "Consultation Updates details updated successfully",
          });
          if (state.form.rounds_type === "NORMAL") {
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
            );
          } else {
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${res.data.external_id}/update`
            );
          }
        } else {
          Notification.Success({
            msg: "Consultation Updates details created successfully",
          });
          if (state.form.rounds_type === "NORMAL") {
            if (data.clone_last) {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${res.data.external_id}/update`
              );
            } else {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`
              );
            }
          } else {
            if (data.clone_last) {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${res.data.external_id}/update`
              );
            } else {
              navigate(
                `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${res.data.external_id}/update`
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
                { id: "NORMAL", text: "Normal" },
                { id: "VENTILATOR", text: "Critical Care" },
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

        {(state.form.clone_last === false || id) && (
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
              required
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

            <CheckBoxFormField
              {...field("recommend_discharge")}
              className="md:col-span-2"
              label="Discharge Recommended"
            />

            {state.form.rounds_type === "NORMAL" && (
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
                  required
                  start={0}
                  end={50}
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
                  required
                  label="Rhythm"
                  options={RHYTHM_CHOICES}
                  optionLabel={(option) => option.desc}
                  optionValue={(option) => option.id}
                />

                <TextAreaFormField
                  {...field("rhythm_detail")}
                  className="md:col-span-2"
                  label="Rhythm Description"
                  rows={5}
                />
              </>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
          <Cancel onClick={() => goBack()} />
          <Submit onClick={(e) => handleSubmit(e)} label={buttonText} />
        </div>
      </form>
    </Page>
  );
};
