import { navigate } from "raviger";

import dayjs from "dayjs";
import { lazy, useCallback, useEffect, useState } from "react";
import {
  CONSCIOUSNESS_LEVEL,
  PATIENT_CATEGORIES,
  REVIEW_AT_CHOICES,
  RHYTHM_CHOICES,
  TELEMEDICINE_ACTIONS,
} from "../../Common/constants";
import useAppHistory from "../../Common/hooks/useAppHistory";
import { DraftSection, useAutoSaveReducer } from "../../Utils/AutoSave";
import * as Notification from "../../Utils/Notifications";
import { formatDateTime } from "../../Utils/utils";
import { capitalize } from "lodash-es";
import BloodPressureFormField, {
  BloodPressureValidator,
} from "../Common/BloodPressureFormField";
import TemperatureFormField from "../Common/TemperatureFormField";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import Page from "../Common/components/Page";
import RangeAutocompleteFormField from "../Form/FormFields/RangeAutocompleteFormField";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { FieldChangeEvent } from "../Form/FormFields/Utils";
import PatientCategorySelect from "./PatientCategorySelect";
import RadioFormField from "../Form/FormFields/RadioFormField";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import { Scribe } from "../Scribe/Scribe";
import { DAILY_ROUND_FORM_SCRIBE_DATA } from "../Scribe/formDetails";
import { DailyRoundsModel } from "./models";
import { fetchEventTypeByName } from "../Facility/ConsultationDetails/Events/types";
import InvestigationBuilder from "../Common/prescription-builder/InvestigationBuilder";
import { FieldErrorText } from "../Form/FormFields/FormField";
import { error } from "@pnotify/core";
import { useTranslation } from "react-i18next";
import PrescriptionBuilder from "../Medicine/PrescriptionBuilder";
import { EditDiagnosesBuilder } from "../Diagnosis/ConsultationDiagnosisBuilder/ConsultationDiagnosisBuilder";
import {
  ConditionVerificationStatuses,
  ConsultationDiagnosis,
} from "../Diagnosis/types";
import { EncounterSymptomsBuilder } from "../Symptoms/SymptomsBuilder";
import { FieldLabel } from "../Form/FormFields/FormField";

const Loading = lazy(() => import("../Common/Loading"));

const initForm: any = {
  physical_examination_info: "",
  other_details: "",
  patient_category: "",
  actions: null,
  action: "",
  review_interval: 0,
  admitted_to: "",
  taken_at: null,
  rounds_type: "NORMAL",
  systolic: null,
  investigations: [],
  investigations_dirty: false,
  diastolic: null,
  pulse: null,
  resp: null,
  temperature: null,
  rhythm: undefined,
  rhythm_detail: "",
  ventilator_spo2: null,
  consciousness_level: undefined,
  bp: {
    systolic: undefined,
    diastolic: undefined,
    mean: undefined,
  },
  // bed: null,
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" })),
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
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const { facilityId, patientId, consultationId, id } = props;
  const [state, dispatch] = useAutoSaveReducer<any>(
    DailyRoundsFormReducer,
    initialState,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [consultationSuggestion, setConsultationSuggestion] = useState<any>("");
  const [prevReviewInterval, setPreviousReviewInterval] = useState(-1);
  const [prevAction, setPreviousAction] = useState("NO_ACTION");
  const [initialData, setInitialData] = useState<any>({
    ...initForm,
    action: "",
  });
  const [diagnoses, setDiagnoses] = useState<ConsultationDiagnosis[]>();
  const headerText = !id ? "Add Consultation Update" : "Info";
  const buttonText = !id ? "Save" : "Continue";

  const formFields = [
    "physical_examination_info",
    "other_details",
    "action",
    "review_interval",
    "bp",
    "pulse",
    "resp",
    "investigations",
    "ventilator_spo2",
    "rhythm",
    "rhythm_detail",
    "consciousness_level",
  ];

  const fetchRoundDetails = useCallback(async () => {
    setIsLoading(true);
    fetchEventTypeByName("");
    let formData: any = initialData;
    if (id) {
      const { data } = await request(routes.getDailyReport, {
        pathParams: { consultationId, id },
      });

      if (data) {
        formData = {
          ...formData,
          ...data,
          patient_category: data.patient_category
            ? PATIENT_CATEGORIES.find((i) => i.text === data.patient_category)
                ?.id ?? ""
            : "",
          rhythm:
            (data.rhythm &&
              RHYTHM_CHOICES.find((i) => i.text === data.rhythm)?.id) ||
            null,
          admitted_to: data.admitted_to ? data.admitted_to : "Select",
        };
      }
    }
    setIsLoading(false);
    if (patientId) {
      const { data } = await request(routes.getPatient, {
        pathParams: { id: patientId },
      });
      if (data) {
        setPatientName(data.name!);
        setFacilityName(data.facility_object!.name);
        setConsultationSuggestion(data.last_consultation?.suggestion);
        setDiagnoses(
          data.last_consultation?.diagnoses?.sort(
            (a: ConsultationDiagnosis, b: ConsultationDiagnosis) =>
              ConditionVerificationStatuses.indexOf(a.verification_status) -
              ConditionVerificationStatuses.indexOf(b.verification_status),
          ),
        );
        setPreviousReviewInterval(
          Number(data.last_consultation?.review_interval),
        );
        const getAction =
          TELEMEDICINE_ACTIONS.find((action) => action.id === data.action)
            ?.text || "NO_ACTION";
        setPreviousAction(getAction);
        setInitialData({
          ...initialData,
          action: getAction,
        });
        formData = {
          ...formData,
          action: getAction,
          investigations: data.last_consultation?.investigation ?? [],
        };
      }
    } else {
      setPatientName("");
      setFacilityName("");
    }
    dispatch({ type: "set_form", form: formData });
    setInitialData(formData);
  }, [consultationId, id, patientId]);

  useEffect(() => {
    fetchRoundDetails();
  }, [fetchRoundDetails]);

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
        case "bp": {
          const error = BloodPressureValidator(state.form.bp);
          if (error) {
            errors.bp = error;
            invalidForm = true;
          }
          return;
        }

        case "investigations": {
          for (const investigation of state.form.investigations) {
            if (!investigation.type?.length) {
              errors[field] = "Investigation field can not be empty";
              invalidForm = true;
              break;
            }
            if (
              investigation.repetitive &&
              !investigation.frequency?.replace(/\s/g, "").length
            ) {
              errors[field] = "Frequency field cannot be empty";
              invalidForm = true;
              break;
            }
            if (
              !investigation.repetitive &&
              !investigation.time?.replace(/\s/g, "").length
            ) {
              errors[field] = "Time field cannot be empty";
              invalidForm = true;
              break;
            }
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

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const validForm = validateForm();
    if (validForm) {
      setIsLoading(true);

      if (
        state.form.rounds_type === "DOCTORS_LOG" &&
        state.form.investigations_dirty
      ) {
        const { error: investigationError } = await request(
          routes.partialUpdateConsultation,
          {
            body: { investigation: state.form.investigations },
            pathParams: { id: consultationId },
          },
        );

        if (investigationError) {
          Notification.Error({ msg: error });
          return;
        }
      }

      let data: DailyRoundsModel = {
        rounds_type: state.form.rounds_type,
        patient_category: state.form.patient_category,
        taken_at: state.form.taken_at
          ? state.form.taken_at
          : new Date().toISOString(),
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
          rhythm: state.form.rhythm || undefined,
          rhythm_detail: state.form.rhythm_detail,
          ventilator_spo2: state.form.ventilator_spo2 ?? null,
          consciousness_level: state.form.consciousness_level || undefined,
        };
      }

      if (id) {
        const { data: obj } = await request(routes.updateDailyReport, {
          body: data,
          pathParams: { consultationId, id },
        });

        setIsLoading(false);

        if (obj) {
          dispatch({ type: "set_form", form: initForm });
          Notification.Success({
            msg: `${obj.rounds_type === "VENTILATOR" ? "Critical Care" : capitalize(obj.rounds_type)} log update details updated successfully`,
          });
          if (["NORMAL", "TELEMEDICINE"].includes(state.form.rounds_type)) {
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`,
            );
          } else {
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${obj.id}/update`,
            );
          }
        }
      } else {
        const { data: obj } = await request(routes.createDailyRounds, {
          pathParams: { consultationId },
          body: data,
        });
        setIsLoading(false);
        if (obj) {
          dispatch({ type: "set_form", form: initForm });
          if (["NORMAL", "TELEMEDICINE"].includes(state.form.rounds_type)) {
            Notification.Success({
              msg: `${state.form.rounds_type === "NORMAL" ? "Normal" : "Tele-medicine"} log update created successfully`,
            });
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`,
            );
          } else if (state.form.rounds_type === "DOCTORS_LOG") {
            Notification.Success({
              msg: "Doctors log update created successfully",
            });
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`,
            );
          } else {
            Notification.Success({
              msg: "Critical Care log update created successfully",
            });
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${obj.id}/update`,
            );
          }
        }
      }
    }
  };

  const handleFormFieldChange = (event: FieldChangeEvent<unknown>) => {
    const form = {
      ...state.form,
      [event.name]: event.value,
    };

    if (event.name === "investigations") {
      form["investigations_dirty"] = true;
    }

    dispatch({ type: "set_form", form });
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
      state.form.review_interval || prevReviewInterval,
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
      <div className="flex w-full justify-end md:m-4">
        <Scribe
          fields={DAILY_ROUND_FORM_SCRIBE_DATA}
          onFormUpdate={(fields) => {
            dispatch({
              type: "set_form",
              form: { ...state.form, ...fields },
            });
            fields.action !== undefined && setPreviousAction(fields.action);
            fields.review_interval !== undefined &&
              setPreviousReviewInterval(Number(fields.review_interval));
          }}
        />
      </div>
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
                "YYYY-MM-DDTHH:mm",
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
                  { id: "DOCTORS_LOG", text: "Doctor's Log Update" },
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

        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
          <div className="pb-6 md:col-span-2">
            <FieldLabel>Symptoms</FieldLabel>
            <EncounterSymptomsBuilder />
          </div>

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

          {state.form.rounds_type !== "DOCTORS_LOG" && (
            <>
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
            </>
          )}

          {["NORMAL", "TELEMEDICINE", "DOCTORS_LOG"].includes(
            state.form.rounds_type,
          ) && (
            <>
              <h3 className="mb-6 md:col-span-2">Vitals</h3>

              <BloodPressureFormField {...field("bp")} label="Blood Pressure" />

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
                placeholder="Unknown"
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
                unselectLabel="Unknown"
                containerClassName="grid gap-1 grid-cols-1"
              />
            </>
          )}

          {state.form.rounds_type === "DOCTORS_LOG" && (
            <>
              <div className="flex flex-col gap-10 divide-y-2 divide-dashed divide-gray-600 border-t-2 border-dashed border-gray-600 pt-6 md:col-span-2">
                <div>
                  <h3 className="mb-4 mt-8 text-lg font-semibold">
                    {t("diagnosis")}
                  </h3>
                  {/*  */}
                  {diagnoses ? (
                    <EditDiagnosesBuilder value={diagnoses} />
                  ) : (
                    <div className="flex animate-pulse justify-center py-4 text-center font-medium text-gray-800">
                      Fetching existing diagnosis of patient...
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="my-4 text-lg font-semibold">
                    {t("investigations")}
                  </h3>
                  <InvestigationBuilder
                    investigations={state.form.investigations}
                    setInvestigations={(investigations) => {
                      handleFormFieldChange({
                        name: "investigations",
                        value: investigations,
                      });
                    }}
                  />
                  <FieldErrorText error={state.errors.investigation} />
                </div>
                <div>
                  <h3 className="mb-4 mt-8 text-lg font-semibold">
                    {t("prescription_medications")}
                  </h3>
                  <PrescriptionBuilder />
                </div>
                <div>
                  <h3 className="mb-4 mt-8 text-lg font-semibold">
                    {t("prn_prescriptions")}
                  </h3>
                  <PrescriptionBuilder is_prn />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
          <Cancel onClick={() => goBack()} />
          <Submit
            disabled={
              buttonText === "Save" &&
              formFields.every(
                (field: string) =>
                  JSON.stringify(state.form[field]) ===
                  JSON.stringify(initialData[field]),
              ) &&
              (state.form.temperature == initialData.temperature ||
                isNaN(state.form.temperature)) &&
              state.form.rounds_type !== "VENTILATOR" &&
              state.form.rounds_type !== "DOCTORS_LOG"
            }
            onClick={(e) => handleSubmit(e)}
            label={buttonText}
          />
        </div>
      </form>
    </Page>
  );
};
