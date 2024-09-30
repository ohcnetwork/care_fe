import { navigate } from "raviger";

import dayjs from "dayjs";
import { lazy, useCallback, useEffect, useState } from "react";
import {
  APPETITE_CHOICES,
  BLADDER_DRAINAGE_CHOICES,
  BLADDER_ISSUE_CHOICES,
  BOWEL_ISSUE_CHOICES,
  CONSCIOUSNESS_LEVEL,
  NUTRITION_ROUTE_CHOICES,
  ORAL_ISSUE_CHOICES,
  PATIENT_CATEGORIES,
  REVIEW_AT_CHOICES,
  RHYTHM_CHOICES,
  SLEEP_CHOICES,
  TELEMEDICINE_ACTIONS,
  URINATION_FREQUENCY_CHOICES,
} from "../../Common/constants";
import useAppHistory from "../../Common/hooks/useAppHistory";
import { DraftSection, useAutoSaveReducer } from "../../Utils/AutoSave";
import * as Notification from "../../Utils/Notifications";
import { formatDateTime } from "../../Utils/utils";
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
import { SCRIBE_FORMS } from "../Scribe/formDetails";
import { DailyRoundsModel, DailyRoundTypes } from "./models";
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
import useAuthUser from "../../Common/hooks/useAuthUser";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import SymptomsApi from "../Symptoms/api";
import { scrollTo } from "../../Utils/utils";
import { ICD11DiagnosisModel } from "../Facility/models";
import NursingCare from "../LogUpdate/Sections/NursingCare";

const Loading = lazy(() => import("../Common/Loading"));

export const DailyRounds = (props: any) => {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const { goBack } = useAppHistory();
  const { facilityId, patientId, consultationId, id } = props;
  const [symptomsSeed, setSymptomsSeed] = useState<number>(1);
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState<
    ICD11DiagnosisModel[]
  >([]);

  const initForm: any = {
    physical_examination_info: "",
    other_details: "",
    patient_category: "",
    actions: null,
    action: "",
    review_interval: 0,
    admitted_to: "",
    taken_at: null,
    rounds_type: authUser.user_type === "Doctor" ? "DOCTORS_LOG" : "NORMAL",
    systolic: null,
    investigations: [],
    investigations_dirty: false,
    symptoms_dirty: false,
    diastolic: null,
    pulse: null,
    resp: null,
    temperature: null,
    rhythm: undefined,
    rhythm_detail: "",
    ventilator_spo2: null,
    consciousness_level: undefined,
    bp: undefined,
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
  const [showDiscontinuedPrescriptions, setShowDiscontinuedPrescriptions] =
    useState(false);
  const headerText = !id ? "Add Consultation Update" : "Info";
  const buttonText = !id
    ? !["VENTILATOR", "DOCTORS_LOG"].includes(state.form.rounds_type)
      ? t("save")
      : t("save_and_continue")
    : t("continue");

  const formFields = [
    "physical_examination_info",
    "other_details",
    "action",
    "review_interval",
    "bp",
    "pulse",
    "temperature",
    "resp",
    "investigations",
    "ventilator_spo2",
    "rhythm",
    "rhythm_detail",
    "consciousness_level",
  ];

  const fetchRoundDetails = useCallback(async () => {
    setIsLoading(true);
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
            ? (PATIENT_CATEGORIES.find((i) => i.text === data.patient_category)
                ?.id ?? "")
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
            scrollTo("patientCategory");
          }
          return;
        case "bp": {
          const error = state.form.bp && BloodPressureValidator(state.form.bp);
          if (error) {
            errors.bp = error;
            invalidForm = true;
            scrollTo("bloodPressure");
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

        case "oral_issue": {
          if (state.form.nutrition_route !== "ORAL" && state.form[field]) {
            errors[field] = t("oral_issue_for_non_oral_nutrition_route_error");
            invalidForm = true;
            break;
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

  const handleSubmit = async () => {
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

      if (state.form.rounds_type !== "VENTILATOR") {
        data = {
          ...data,
          bp: state.form.bp,
          pulse: state.form.pulse ?? null,
          resp: state.form.resp ?? null,
          temperature: state.form.temperature ?? null,
          rhythm: state.form.rhythm || undefined,
          rhythm_detail: state.form.rhythm_detail,
          ventilator_spo2: state.form.ventilator_spo2 ?? null,
          consciousness_level: state.form.consciousness_level || undefined,
          bowel_issue: state.form.bowel_issue ?? undefined,
          bladder_drainage: state.form.bladder_drainage ?? undefined,
          bladder_issue: state.form.bladder_issue ?? undefined,
          is_experiencing_dysuria: state.form.is_experiencing_dysuria,
          urination_frequency: state.form.urination_frequency ?? undefined,
          sleep: state.form.sleep ?? undefined,
          nutrition_route: state.form.nutrition_route ?? undefined,
          oral_issue: state.form.oral_issue ?? undefined,
          appetite: state.form.appetite ?? undefined,
          blood_sugar_level: state.form.blood_sugar_level,
          nursing: state.form.nursing,
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
            msg: t("LOG_UPDATE_UPDATED_NOTIFICATION", {
              roundType: t(`ROUNDS_TYPE__${state.form.rounds_type}`),
            }),
          });
          if (
            ["NORMAL", "TELEMEDICINE", "COMMUNITY_NURSES_LOG"].includes(
              state.form.rounds_type,
            )
          ) {
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
          Notification.Success({
            msg: t("LOG_UPDATE_CREATED_NOTIFICATION", {
              roundType: t(`ROUNDS_TYPE__${state.form.rounds_type}`),
            }),
          });

          if (
            ["NORMAL", "TELEMEDICINE", "COMMUNITY_NURSES_LOG"].includes(
              state.form.rounds_type,
            )
          ) {
            navigate(
              `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}`,
            );
          } else {
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

    if (event.name === "nutrition_route" && event.value !== "ORAL") {
      form["oral_issue"] = undefined;
    }

    dispatch({ type: "set_form", form });
  };

  const field = (name: string) => {
    return {
      id: name,
      label: t(`LOG_UPDATE_FIELD_LABEL__${name}`),
      name,
      value: state.form[name],
      error: state.errors[name],
      onChange: handleFormFieldChange,
    };
  };

  const selectField = <T extends string>(
    name: keyof DailyRoundsModel,
    options: readonly T[],
  ) => {
    return {
      ...field(name),
      options,
      optionLabel: (option: T) => t(`${name.toUpperCase()}__${option}`),
      optionValue: (option: T) => option,
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

  const roundTypes: (typeof DailyRoundTypes)[number][] = [];

  if (
    ["Doctor", "Staff", "DistrictAdmin", "StateAdmin"].includes(
      authUser.user_type,
    )
  ) {
    roundTypes.push("DOCTORS_LOG");
  }
  roundTypes.push("NORMAL", "COMMUNITY_NURSES_LOG", "VENTILATOR");
  if (consultationSuggestion === "DC") {
    roundTypes.push("TELEMEDICINE");
  }

  const submitButtonDisabled = (() => {
    if (buttonText !== "Save") {
      return false;
    }

    if (
      ["VENTILATOR", "DOCTORS_LOG", "COMMUNITY_NURSES_LOG"].includes(
        state.form.rounds_type,
      )
    ) {
      return false;
    }

    if (state.form["symptoms_dirty"]) {
      return false;
    }

    if (
      formFields.every(
        (field) =>
          JSON.stringify(state.form[field]) ===
          JSON.stringify(initialData[field]),
      )
    ) {
      return true;
    }

    return false;
  })();

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
          facilityId={facilityId}
          form={SCRIBE_FORMS.daily_round}
          onFormUpdate={async (fields) => {
            setDiagnosisSuggestions([]);
            // Symptoms
            let rounds_type = fields.rounds_type || state.form.rounds_type;
            if (fields.additional_symptoms) {
              for (const symptom of fields.additional_symptoms) {
                const { res } = await request(SymptomsApi.add, {
                  pathParams: { consultationId },
                  body: {
                    ...symptom,
                  },
                });
                if (res?.ok) setSymptomsSeed((s) => s + 1);
              }
            }

            // ICD11 Diagnosis
            if (fields.icd11_diagnosis) {
              for (const diagnosis of fields.icd11_diagnosis) {
                // Fetch available diagnoses

                const { res: icdRes, data: icdData } = await request(
                  routes.listICD11Diagnosis,
                  {
                    query: { query: diagnosis.diagnosis },
                  },
                );

                if (!icdRes?.ok) {
                  error({
                    text: "Failed to fetch ICD11 Diagnosis",
                  });
                  continue;
                }

                const availableDiagnosis = icdData?.slice(0, 5);

                if (availableDiagnosis?.length)
                  setDiagnosisSuggestions(availableDiagnosis);
              }
            }

            if (
              Object.keys(fields).some((f) =>
                [
                  "investigations",
                  "icd11_diagnosis",
                  "additional_symptoms",
                ].includes(f),
              ) &&
              roundTypes.some((t) => t === "DOCTORS_LOG")
            ) {
              rounds_type = "DOCTORS_LOG";
            }

            dispatch({
              type: "set_form",
              form: { ...state.form, ...fields, rounds_type },
            });
            fields.action !== undefined && setPreviousAction(fields.action);
            fields.review_interval !== undefined &&
              setPreviousReviewInterval(Number(fields.review_interval));
          }}
        />
      </div>
      <form className="w-full max-w-4xl rounded-lg bg-white px-3 py-5 shadow sm:px-6 md:py-11">
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
              {...selectField("rounds_type", roundTypes)}
              required
              className="w-full"
            />
          </div>
          <div className="w-full md:w-1/3">
            <PatientCategorySelect
              {...field("patient_category")}
              required
              id="patientCategory"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
          <div className="pb-6 md:col-span-2">
            <FieldLabel>Symptoms</FieldLabel>
            <EncounterSymptomsBuilder
              key={symptomsSeed}
              onChange={() => {
                handleFormFieldChange({
                  name: "symptoms_dirty",
                  value: true,
                });
              }}
            />
          </div>

          <TextAreaFormField {...field("physical_examination_info")} rows={5} />
          <TextAreaFormField {...field("other_details")} rows={5} />

          {state.form.rounds_type === "COMMUNITY_NURSES_LOG" && (
            <>
              <hr className="my-4 md:col-span-2" />
              <h3 className="mb-6 md:col-span-2">{t("routine")}</h3>
              <SelectFormField {...selectField("sleep", SLEEP_CHOICES)} />
              <SelectFormField
                {...selectField("bowel_issue", BOWEL_ISSUE_CHOICES)}
              />
              <div className="grid gap-x-6 md:col-span-2 md:grid-cols-3">
                <h5 className="mb-3 md:col-span-3">{t("bladder")}</h5>
                <SelectFormField
                  {...selectField("bladder_drainage", BLADDER_DRAINAGE_CHOICES)}
                />
                <SelectFormField
                  {...selectField("bladder_issue", BLADDER_ISSUE_CHOICES)}
                />
                <SelectFormField
                  {...field("is_experiencing_dysuria")}
                  options={[true, false]}
                  optionLabel={(c) => t(c ? "yes" : "no")}
                />
                <SelectFormField
                  {...selectField(
                    "urination_frequency",
                    URINATION_FREQUENCY_CHOICES,
                  )}
                />
              </div>
              <div className="grid gap-x-6 md:col-span-2 md:grid-cols-2">
                <h5 className="mb-3 md:col-span-2">{t("nutrition")}</h5>
                <SelectFormField
                  {...selectField("nutrition_route", NUTRITION_ROUTE_CHOICES)}
                />
                <SelectFormField
                  {...selectField("oral_issue", ORAL_ISSUE_CHOICES)}
                  disabled={state.form.nutrition_route !== "ORAL"}
                />
                <SelectFormField
                  {...selectField("appetite", APPETITE_CHOICES)}
                />
              </div>
            </>
          )}

          {[
            "NORMAL",
            "TELEMEDICINE",
            "DOCTORS_LOG",
            "COMMUNITY_NURSES_LOG",
          ].includes(state.form.rounds_type) && (
            <>
              <hr className="my-4 md:col-span-2" />
              <h3 className="mb-6 md:col-span-2">{t("vitals")}</h3>

              <BloodPressureFormField {...field("bp")} id="bloodPressure" />

              <RangeAutocompleteFormField
                {...field("pulse")}
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
            </>
          )}

          {state.form.rounds_type === "COMMUNITY_NURSES_LOG" && (
            <>
              <RangeAutocompleteFormField
                {...field("blood_sugar_level")}
                unit="mg/dL"
                start={0}
                end={700}
                step={1}
                thresholds={[
                  {
                    value: 0,
                    className: "text-danger-500",
                    label: "Low",
                  },
                  {
                    value: 69,
                    className: "text-primary-500",
                    label: "Normal",
                  },
                  {
                    value: 110,
                    className: "text-danger-500",
                    label: "High",
                  },
                ]}
              />
            </>
          )}

          {["NORMAL", "TELEMEDICINE", "DOCTORS_LOG"].includes(
            state.form.rounds_type,
          ) && (
            <>
              <TemperatureFormField {...field("temperature")} />

              <RangeAutocompleteFormField
                {...field("resp")}
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
                placeholder={t("HEARTBEAT_RHYTHM__UNKNOWN")}
                options={RHYTHM_CHOICES}
                optionLabel={(option) => option.desc}
                optionValue={(option) => option.id}
              />

              <TextAreaFormField
                {...field("rhythm_detail")}
                className="md:col-span-1"
                rows={7}
              />

              <RadioFormField
                {...selectField(
                  "consciousness_level",
                  CONSCIOUSNESS_LEVEL.map((a) => a.value),
                )}
                options={CONSCIOUSNESS_LEVEL.map((level) => ({
                  label: t(`CONSCIOUSNESS_LEVEL__${level.value}`),
                  value: level.value,
                }))}
                optionLabel={(option) => option.label}
                optionValue={(option) => option.value}
                unselectLabel="Unknown"
                layout="vertical"
              />
            </>
          )}

          {state.form.rounds_type === "COMMUNITY_NURSES_LOG" && (
            <div className="md:col-span-2">
              <hr className="my-4 md:col-span-2" />
              <div className="mb-4 mt-8 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {t("prescription_medications")}
                </h3>
                <CheckBoxFormField
                  label="Include discontinued prescriptions"
                  name="toggle-discontinued-prescriptions-visibility"
                  value={showDiscontinuedPrescriptions}
                  onChange={({ value }) =>
                    setShowDiscontinuedPrescriptions(value)
                  }
                  errorClassName="hidden"
                />
              </div>
              <PrescriptionBuilder
                discontinued={showDiscontinuedPrescriptions ? undefined : false}
                actions={["discontinue"]}
              />
            </div>
          )}

          {state.form.rounds_type === "COMMUNITY_NURSES_LOG" && (
            <div className="md:col-span-2">
              <hr className="mb-4 mt-8 md:col-span-2" />
              <div className="mb-4 mt-8 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("nursing_care")}</h3>
              </div>
              <NursingCare
                log={{ nursing: state.form.nursing }}
                onChange={(log) =>
                  handleFormFieldChange({ name: "nursing", value: log.nursing })
                }
              />
            </div>
          )}

          {state.form.rounds_type === "DOCTORS_LOG" && (
            <>
              <div className="flex flex-col gap-10 divide-y-2 divide-dashed divide-secondary-600 border-t-2 border-dashed border-secondary-600 pt-6 md:col-span-2">
                <div id="diagnosis-list">
                  <h3 className="mb-4 mt-8 text-lg font-semibold">
                    {t("diagnosis")}
                  </h3>
                  {diagnoses ? (
                    <EditDiagnosesBuilder
                      value={diagnoses}
                      suggestions={diagnosisSuggestions}
                      onUpdate={() => setDiagnosisSuggestions([])}
                    />
                  ) : (
                    <div className="flex animate-pulse justify-center py-4 text-center font-medium text-secondary-800">
                      Fetching existing diagnosis of patient...
                    </div>
                  )}
                </div>
                <div id="investigation">
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
                  <div className="mb-4 mt-8 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {t("prescription_medications")}
                    </h3>
                    <CheckBoxFormField
                      label="Include discontinued prescriptions"
                      name="toggle-discontinued-prescriptions-visibility"
                      value={showDiscontinuedPrescriptions}
                      onChange={({ value }) =>
                        setShowDiscontinuedPrescriptions(value)
                      }
                      errorClassName="hidden"
                    />
                  </div>
                  <PrescriptionBuilder
                    discontinued={
                      showDiscontinuedPrescriptions ? undefined : false
                    }
                    actions={["discontinue"]}
                  />
                </div>
                <div>
                  <div className="mb-4 mt-8 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {t("prn_prescriptions")}
                    </h3>
                    <CheckBoxFormField
                      label="Include discontinued prescriptions"
                      name="toggle-discontinued-prescriptions-visibility"
                      value={showDiscontinuedPrescriptions}
                      onChange={({ value }) =>
                        setShowDiscontinuedPrescriptions(value)
                      }
                      errorClassName="hidden"
                    />
                  </div>
                  <PrescriptionBuilder
                    is_prn
                    discontinued={
                      showDiscontinuedPrescriptions ? undefined : false
                    }
                    actions={["discontinue"]}
                  />
                </div>
              </div>
            </>
          )}

          {state.form.rounds_type !== "DOCTORS_LOG" && (
            <>
              <hr className="mb-4 mt-8 md:col-span-2" />
              <SelectFormField
                {...field("action")}
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
        </div>

        <div className="mt-4 flex flex-col-reverse justify-end gap-2 md:flex-row">
          <Cancel onClick={() => goBack()} />
          <Submit
            disabled={submitButtonDisabled}
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            label={buttonText}
          />
        </div>
      </form>
    </Page>
  );
};
