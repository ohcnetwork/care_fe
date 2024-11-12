import careConfig from "@careConfig";
import { t } from "i18next";
import { navigate } from "raviger";
import { LegacyRef, createRef, useEffect, useRef, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { BedSelect } from "@/components/Common/BedSelect";
import { Cancel, Submit } from "@/components/Common/ButtonV2";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import Loading from "@/components/Common/Loading";
import { LocationSelect } from "@/components/Common/LocationSelect";
import PageTitle from "@/components/Common/PageTitle";
import RouteToFacilitySelect, {
  RouteToFacility,
} from "@/components/Common/RouteToFacilitySelect";
import UserAutocomplete from "@/components/Common/UserAutocompleteFormField";
import InvestigationBuilder, {
  InvestigationType,
} from "@/components/Common/prescription-builder/InvestigationBuilder";
import ProcedureBuilder, {
  ProcedureType,
} from "@/components/Common/prescription-builder/ProcedureBuilder";
import {
  CreateDiagnosesBuilder,
  EditDiagnosesBuilder,
} from "@/components/Diagnosis/ConsultationDiagnosisBuilder/ConsultationDiagnosisBuilder";
import {
  ConditionVerificationStatuses,
  ConsultationDiagnosis,
  CreateDiagnosis,
} from "@/components/Diagnosis/types";
import Beds from "@/components/Facility/Consultations/Beds";
import { BedModel, FacilityModel } from "@/components/Facility/models";
import CheckBoxFormField from "@/components/Form/FormFields/CheckBoxFormField";
import DateFormField from "@/components/Form/FormFields/DateFormField.js";
import {
  FieldErrorText,
  FieldLabel,
} from "@/components/Form/FormFields/FormField";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";
import TextAreaFormField from "@/components/Form/FormFields/TextAreaFormField";
import TextFormField from "@/components/Form/FormFields/TextFormField";
import {
  FieldChangeEvent,
  FieldChangeEventHandler,
} from "@/components/Form/FormFields/Utils";
import { FormAction } from "@/components/Form/Utils";
import PatientCategorySelect from "@/components/Patient/PatientCategorySelect";
import {
  CreateSymptomsBuilder,
  EncounterSymptomsBuilder,
} from "@/components/Symptoms/SymptomsBuilder";
import { EncounterSymptom } from "@/components/Symptoms/types";
import { UserBareMinimum } from "@/components/Users/models";

import useAppHistory from "@/hooks/useAppHistory";
import useVisibility from "@/hooks/useVisibility";

import {
  CONSULTATION_SUGGESTION,
  ConsultationSuggestionValue,
  DISCHARGE_REASONS,
  PATIENT_CATEGORIES,
  REVIEW_AT_CHOICES,
  TELEMEDICINE_ACTIONS,
} from "@/common/constants";

import { DraftSection, useAutoSaveReducer } from "@/Utils/AutoSave";
import * as Notification from "@/Utils/Notifications";
import dayjs from "@/Utils/dayjs";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useQuery from "@/Utils/request/useQuery";
import { Writable } from "@/Utils/types";
import { classNames } from "@/Utils/utils";

type BooleanStrings = "true" | "false";

type FormDetails = {
  is_asymptomatic: boolean;
  suggestion: ConsultationSuggestionValue;
  route_to_facility?: RouteToFacility;
  patient: string;
  facility: string;
  admitted: BooleanStrings;
  admitted_to: string;
  category: string;
  encounter_date?: Date;
  icu_admission_date?: Date;
  discharge_date: null;
  referred_to?: string;
  referred_to_external?: string;
  referred_from_facility?: string;
  referred_from_facility_external?: string;
  referred_by_external?: string;
  transferred_from_location?: string;
  treating_physician: string;
  treating_physician_object: UserBareMinimum | null;
  create_diagnoses: CreateDiagnosis[];
  diagnoses: ConsultationDiagnosis[];
  symptoms: EncounterSymptom[];
  create_symptoms: Writable<EncounterSymptom>[];
  is_kasp: BooleanStrings;
  kasp_enabled_date: null;
  examination_details: string;
  history_of_present_illness: string;
  treatment_plan: string;
  consultation_notes: string;
  patient_no: string;
  procedure: ProcedureType[];
  investigation: InvestigationType[];
  is_telemedicine: BooleanStrings;
  action?: number;
  assigned_to: string;
  assigned_to_object: UserBareMinimum | null;
  special_instruction: string;
  review_interval: number;
  weight: string;
  height: string;
  bed: BedModel | null;
  new_discharge_reason: number | null;
  cause_of_death: string;
  death_datetime: string;
  death_confirmed_doctor: string;
  InvestigationAdvice: InvestigationType[];
  procedures: ProcedureType[];
};

const initForm: FormDetails = {
  is_asymptomatic: false,
  create_symptoms: [],
  symptoms: [],
  suggestion: "A",
  route_to_facility: undefined,
  patient: "",
  facility: "",
  admitted: "false",
  admitted_to: "",
  category: "",
  encounter_date: new Date(),
  icu_admission_date: undefined,
  discharge_date: null,
  referred_to: "",
  referred_to_external: "",
  referred_from_facility: "",
  referred_from_facility_external: "",
  referred_by_external: "",
  transferred_from_location: "",
  treating_physician: "",
  treating_physician_object: null,
  create_diagnoses: [],
  diagnoses: [],
  is_kasp: "false",
  kasp_enabled_date: null,
  examination_details: "",
  history_of_present_illness: "",
  treatment_plan: "",
  consultation_notes: "",
  patient_no: "",
  procedure: [],
  investigation: [],
  is_telemedicine: "false",
  action: 10,
  assigned_to: "",
  assigned_to_object: null,
  special_instruction: "",
  review_interval: -1,
  weight: "",
  height: "",
  bed: null,
  new_discharge_reason: null,
  cause_of_death: "",
  death_datetime: "",
  death_confirmed_doctor: "",
  InvestigationAdvice: [],
  procedures: [],
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" })),
);

const isoStringToDate = (isoDate: string) =>
  (dayjs(isoDate).isValid() && dayjs(isoDate).toDate()) || undefined;

const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};

const formErrorKeys = Object.keys(initError);

const fieldRef = formErrorKeys.reduce(
  (acc: { [key: string]: React.RefObject<any> }, key) => {
    acc[key] = createRef();
    return acc;
  },
  {},
);

const consultationFormReducer = (state = initialState, action: FormAction) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: { ...state.form, ...action.form },
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
  }
};

type ConsultationFormSection =
  | "Consultation Details"
  | "Diagnosis"
  | "Treatment Plan"
  | "Bed Status";

type Props = {
  facilityId: string;
  patientId: string;
  id?: string;
};

export const ConsultationForm = ({ facilityId, patientId, id }: Props) => {
  const { goBack } = useAppHistory();
  const submitController = useRef<AbortController>();
  const [state, dispatch] = useAutoSaveReducer<FormDetails>(
    consultationFormReducer,
    initialState,
  );
  const [bed, setBed] = useState<BedModel | BedModel[] | null>(null);
  const [referredToFacility, setReferredToFacility] =
    useState<FacilityModel | null>(null);
  const [referredFromFacility, setReferredFromFacility] =
    useState<FacilityModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const isUpdate = !!id;

  const [currentSection, setCurrentSection] = useState<ConsultationFormSection>(
    "Consultation Details",
  );
  const [consultationDetailsVisible, consultationDetailsRef] = useVisibility();
  const [diagnosisVisible, diagnosisRef] = useVisibility(-300);
  const [treatmentPlanVisible, treatmentPlanRef] = useVisibility(-300);
  const [bedStatusVisible, bedStatusRef] = useVisibility(-300);

  const [disabledFields, setDisabledFields] = useState<string[]>([]);

  const sections = {
    "Consultation Details": {
      iconClass: "l-medkit",
      visible: consultationDetailsVisible,
      ref: consultationDetailsRef,
    },
    Diagnosis: {
      iconClass: "l-stethoscope",
      visible: diagnosisVisible,
      ref: diagnosisRef,
    },
    "Treatment Plan": {
      iconClass: "l-clipboard-alt",
      visible: treatmentPlanVisible,
      ref: treatmentPlanRef,
    },
    "Bed Status": {
      iconClass: "l-bed",
      visible: bedStatusVisible,
      ref: bedStatusRef,
    },
  } as const;

  useEffect(() => {
    setCurrentSection((prev) => {
      if (consultationDetailsVisible) return "Consultation Details";
      if (diagnosisVisible) return "Diagnosis";
      if (treatmentPlanVisible) return "Treatment Plan";
      if (bedStatusVisible) return "Bed Status";
      return prev;
    });
  }, [
    consultationDetailsVisible,
    diagnosisVisible,
    treatmentPlanVisible,
    bedStatusVisible,
  ]);

  const { loading: loadingPatient } = useQuery(routes.getPatient, {
    pathParams: { id: patientId },
    onResponse: ({ data }) => {
      if (!data) return;
      if (isUpdate) {
        dispatch({
          type: "set_form",
          form: { ...state.form, action: data.action },
        });
      }
      setPatientName(data.name ?? "");
      setFacilityName(data.facility_object?.name ?? "");
    },
    prefetch: !!patientId,
  });

  useEffect(() => {
    dispatch({
      type: "set_form",
      form: { ...state.form, encounter_date: new Date() },
    });
  }, []);

  const handleFormFieldChange: FieldChangeEventHandler<unknown> = (event) => {
    if (event.name === "suggestion" && event.value === "DD") {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          suggestion: "DD",
          consultation_notes: "Patient declared dead",
        },
      });
      return;
    }

    if (event.name === "is_asymptomatic" && event.value === true) {
      dispatch({
        type: "set_form",
        form: { ...state.form, [event.name]: event.value, create_symptoms: [] },
      });
      return;
    }

    dispatch({
      type: "set_form",
      form: { ...state.form, [event.name]: event.value },
    });
  };

  const { loading: consultationLoading, refetch } = useQuery(
    routes.getConsultation,
    {
      pathParams: { id: id! },
      prefetch: !!(id && ((patientId && patientName) || !patientId)),
      onResponse: ({ data }) => {
        if (!data) return;
        handleFormFieldChange({
          name: "InvestigationAdvice",
          value:
            (Array.isArray(data.investigation) && data.investigation) || [],
        });
        handleFormFieldChange({
          name: "procedure",
          value: (Array.isArray(data.procedure) && data.procedure) || [],
        });
        if (data.suggestion === "R") {
          if (data.referred_to_external)
            setReferredToFacility({
              name: data.referred_to_external,
            });
          else setReferredToFacility(data.referred_to_object ?? null);
        }
        if (data.route_to_facility === 20) {
          if (data.referred_from_facility_external)
            setReferredFromFacility({
              name: data.referred_from_facility_external,
            });
          else
            setReferredFromFacility(data.referred_from_facility_object ?? null);
        }

        if (data) {
          const formData = {
            ...data,
            encounter_date: isoStringToDate(data.encounter_date),
            icu_admission_date:
              data.icu_admission_date &&
              isoStringToDate(data.icu_admission_date),
            admitted: data.admitted ? String(data.admitted) : "false",
            admitted_to: data.admitted_to ? data.admitted_to : "",
            category: data.category
              ? (PATIENT_CATEGORIES.find((i) => i.text === data.category)?.id ??
                "")
              : "",
            patient_no: data.patient_no ?? "",
            OPconsultation: data.consultation_notes,
            is_telemedicine: `${data.is_telemedicine}`,
            is_kasp: `${data.is_kasp}`,
            assigned_to: data.assigned_to || "",
            assigned_to_object: data.assigned_to_object,
            treating_physician: data.treating_physician || "",
            treating_physician_object: data.treating_physician_object,
            ett_tt: data.ett_tt ? Number(data.ett_tt) : 3,
            special_instruction: data.special_instruction || "",
            weight: data.weight ? data.weight : "",
            height: data.height ? data.height : "",
            bed: data?.current_bed?.bed_object || null,
            new_discharge_reason: data?.new_discharge_reason || null,
            cause_of_death: data?.discharge_notes || "",
            death_datetime: data?.death_datetime || "",
            death_confirmed_doctor: data?.death_confirmed_doctor || "",
            InvestigationAdvice: data.investigation ?? [],
            diagnoses: data.diagnoses?.sort(
              (a: ConsultationDiagnosis, b: ConsultationDiagnosis) =>
                ConditionVerificationStatuses.indexOf(a.verification_status) -
                ConditionVerificationStatuses.indexOf(b.verification_status),
            ),
          };
          dispatch({
            type: "set_form",
            form: { ...state.form, ...(formData as unknown as FormDetails) },
          });
          setBed(formData.bed);

          if (data.last_daily_round && state.form.category) {
            setDisabledFields((fields) => [...fields, "category"]);
          }
        } else {
          goBack();
        }
      },
    },
  );

  if (isLoading || loadingPatient || consultationLoading) return <Loading />;

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;

    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "category":
          if (!state.form[field]) {
            errors[field] = "Please select a category";
            invalidForm = true;
          }
          return;
        case "suggestion":
          if (!state.form[field]) {
            errors[field] = "Please enter the decision";
            invalidForm = true;
          }
          return;
        case "route_to_facility":
          if (!state.form[field]) {
            errors[field] = t("field_required");
            invalidForm = true;
          }
          return;
        case "patient_no":
          if (state.form.suggestion !== "A") return;
          if (!state.form[field]) {
            errors[field] = "IP Number is required as person is admitted";
            invalidForm = true;
          } else if (!state.form[field].replace(/\s/g, "").length) {
            errors[field] = "IP can not be empty";
            invalidForm = true;
          }
          return;
        case "encounter_date":
          if (!state.form[field]) {
            errors[field] = t("field_required");
            invalidForm = true;
          }
          if (
            dayjs(state.form.encounter_date).isBefore(
              careConfig.minEncounterDate,
            )
          ) {
            errors[field] =
              `Admission date cannot be before ${careConfig.minEncounterDate}`;
            invalidForm = true;
          }
          return;
        case "cause_of_death":
          if (state.form.suggestion === "DD" && !state.form[field]) {
            errors[field] = "Please enter cause of death";
            invalidForm = true;
          }
          return;
        case "create_symptoms":
          if (
            !isUpdate &&
            !state.form.is_asymptomatic &&
            state.form[field].length === 0
          ) {
            errors[field] =
              "Symptoms needs to be added as the patient is symptomatic";
            invalidForm = true;
          }
          return;
        case "death_datetime":
          if (state.form.suggestion === "DD" && !state.form[field]) {
            errors[field] = "Please enter the date & time of death";
            invalidForm = true;
          }
          return;
        case "death_confirmed_doctor":
          if (state.form.suggestion === "DD" && !state.form[field]) {
            errors[field] =
              "Please enter the name of doctor who confirmed the death";
            invalidForm = true;
          }
          return;
        case "referred_to":
          if (
            state.form.suggestion === "R" &&
            !state.form[field] &&
            !state.form["referred_to_external"]
          ) {
            errors[field] = "Please select the referred to facility";
            invalidForm = true;
          }
          return;
        case "referred_from_facility":
          if (
            state.form.route_to_facility === 20 &&
            !state.form[field] &&
            !state.form["referred_from_facility_external"]
          ) {
            errors[field] = "Please select the referred from facility";
            invalidForm = true;
          }
          return;
        case "transferred_from_location":
          if (state.form.route_to_facility === 30 && !state.form[field]) {
            errors[field] =
              "Name of Ward/ICU the patient is being transferred from is required";
            invalidForm = true;
          }
          return;
        case "is_telemedicine":
          if (
            state.form.admitted_to === "Home Isolation" &&
            state.form[field] === "false"
          ) {
            errors[field] =
              "Telemedicine should be `Yes` when Admitted To is Home Isolation";
            invalidForm = true;
          }
          return;
        case "is_kasp":
          if (!state.form[field]) {
            errors[field] =
              `Please select an option, ${careConfig.kasp.string} is mandatory`;
            invalidForm = true;
          }
          return;
        case "procedure": {
          for (const p of state.form.procedure) {
            if (!p.procedure?.replace(/\s/g, "").length) {
              errors[field] = "Procedure field can not be empty";
              invalidForm = true;
              break;
            }
            if (!p.repetitive && !p.time?.replace(/\s/g, "").length) {
              errors[field] = "Time field can not be empty";
              invalidForm = true;
              break;
            }
            if (p.repetitive && !p.frequency?.replace(/\s/g, "").length) {
              errors[field] = "Frequency field can not be empty";
              invalidForm = true;
              break;
            }
          }
          return;
        }

        case "investigation": {
          for (const i of state.form.InvestigationAdvice) {
            if (!i.type?.length) {
              errors[field] = "Investigation field can not be empty";
              invalidForm = true;
              break;
            }
            if (i.repetitive && !i.frequency?.replace(/\s/g, "").length) {
              errors[field] = "Frequency field cannot be empty";
              invalidForm = true;
              break;
            }
            if (!i.repetitive && !i.time?.replace(/\s/g, "").length) {
              errors[field] = "Time field cannot be empty";
              invalidForm = true;
              break;
            }
          }
          return;
        }

        case "treating_physician": {
          if (state.form.suggestion === "DC") {
            break;
          }
          if (state.form.suggestion !== "DD" && !state.form[field]) {
            errors[field] = t("field_required");
            invalidForm = true;
            break;
          }
          return;
        }
        case "weight":
        case "height": {
          if (state.form[field] && state.form.suggestion !== "DD") {
            const value = state.form[field];
            if (!value || parseFloat(value) <= 0) {
              errors[field] = `Please enter a valid ${field}`;
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
    if (invalidForm) {
      dispatch({ type: "set_errors", errors });
      const firstError = Object.keys(errors).find((key) => errors[key]);
      if (firstError) {
        fieldRef[firstError].current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return false;
    }
    dispatch({ type: "set_errors", errors });
    return true;
  };

  const declareThePatientDead = async (
    id: string,
    cause_of_death: string,
    death_datetime: string,
    death_confirmed_doctor: string,
  ) => {
    await request(routes.dischargePatient, {
      pathParams: { id },
      body: {
        new_discharge_reason: DISCHARGE_REASONS.find(
          (i) => i.text === "Expired",
        )?.id,
        discharge_notes: cause_of_death,
        death_datetime: death_datetime,
        death_confirmed_doctor: death_confirmed_doctor,
        discharge_date: dayjs().toISOString(),
      },
    });
  };

  const handleSubmit = async (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    const validated = validateForm();
    if (validated) {
      setIsLoading(true);
      const data: any = {
        suggestion: state.form.suggestion,
        route_to_facility: state.form.route_to_facility,
        admitted: state.form.suggestion === "A",
        encounter_date: state.form.encounter_date,
        category: state.form.category,
        is_kasp: state.form.is_kasp,
        kasp_enabled_date: JSON.parse(state.form.is_kasp) ? new Date() : null,
        examination_details: state.form.examination_details,
        history_of_present_illness: state.form.history_of_present_illness,
        treatment_plan: state.form.treatment_plan,
        discharge_date: state.form.discharge_date,
        create_diagnoses: isUpdate ? undefined : state.form.create_diagnoses,
        create_symptoms: isUpdate ? undefined : state.form.create_symptoms,
        treating_physician: state.form.treating_physician,
        investigation: state.form.InvestigationAdvice,
        procedure: state.form.procedure,
        patient: patientId,
        facility: facilityId,
        referred_to:
          state.form.suggestion === "R" && !state.form.referred_to_external
            ? state.form.referred_to
            : undefined,
        referred_to_external:
          state.form.suggestion === "R" && !state.form.referred_to
            ? state.form.referred_to_external
            : undefined,
        referred_from_facility:
          state.form.route_to_facility === 20 &&
          !state.form.referred_from_facility_external
            ? state.form.referred_from_facility
            : undefined,
        referred_from_facility_external:
          state.form.route_to_facility === 20 &&
          !state.form.referred_from_facility
            ? state.form.referred_from_facility_external
            : undefined,
        referred_by_external:
          state.form.route_to_facility === 20
            ? state.form.referred_by_external
            : undefined,
        transferred_from_location:
          state.form.route_to_facility === 30
            ? state.form.transferred_from_location
            : undefined,
        consultation_notes: state.form.consultation_notes,
        is_telemedicine: state.form.is_telemedicine,
        icu_admission_date:
          state.form.route_to_facility === 30
            ? state.form.icu_admission_date
            : undefined,
        action: state.form.action,
        review_interval: state.form.review_interval,
        assigned_to:
          state.form.is_telemedicine.toString() === "true"
            ? state.form.assigned_to
            : "",
        special_instruction: state.form.special_instruction,
        weight: Number(state.form.weight),
        height: Number(state.form.height),
        bed: bed && bed instanceof Array ? bed[0]?.id : bed?.id,
        patient_no: state.form.patient_no || null,
      };

      const { data: obj } = await request(
        id ? routes.updateConsultation : routes.createConsultation,
        {
          pathParams: id ? { id } : undefined,
          body: data,
          controllerRef: submitController,
        },
      );

      setIsLoading(false);
      if (obj) {
        dispatch({ type: "set_form", form: initForm });

        if (data.suggestion === "DD") {
          await declareThePatientDead(
            obj.id,
            state.form.cause_of_death,
            state.form.death_datetime,
            state.form.death_confirmed_doctor,
          );
        }

        Notification.Success({
          msg: obj.discharge_date
            ? "Patient discharged successfully"
            : `Consultation ${id ? "updated" : "created"} successfully`,
        });

        navigate(
          `/facility/${facilityId}/patient/${patientId}/consultation/${obj.id}`,
        );

        if (data.suggestion === "R") {
          navigate(`/facility/${facilityId}/patient/${patientId}/shift/new`);
          return;
        } else if (!id && data.suggestion === "A") {
          navigate(
            `/facility/${facilityId}/patient/${patientId}/consultation/${obj.id}/prescriptions`,
          );
        }
      }
    }
  };

  const handleDoctorSelect = (
    event: FieldChangeEvent<UserBareMinimum | null>,
  ) => {
    if (event.value?.id) {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          [event.name]: event.value.id.toString(),
          [`${event.name}_object`]: event.value,
        },
      });
    } else {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          [event.name]: "",
          [`${event.name}_object`]: null,
        },
      });
    }
  };

  const sectionId = (section: ConsultationFormSection) =>
    section.toLowerCase().replace(" ", "-");

  const sectionTitle = (
    sectionTitle: ConsultationFormSection,
    required = false,
  ) => {
    const section = sections[sectionTitle];
    return (
      <div
        id={sectionId(sectionTitle)}
        className="col-span-6 -ml-2 mb-6 flex flex-row items-center"
        ref={section.ref as LegacyRef<HTMLDivElement>}
      >
        <CareIcon icon={section.iconClass} className="mr-3 text-xl" />
        <label className="text-lg font-bold text-secondary-900">
          {sectionTitle}
          {required && <span className="text-danger-500">{" *"}</span>}
        </label>
        <hr className="ml-6 flex-1 border border-secondary-400" />
      </div>
    );
  };

  const handleReferredToFacilityChange = (
    selected: FacilityModel | FacilityModel[] | null,
  ) => {
    const selectedFacility = selected as FacilityModel;
    setReferredToFacility(selectedFacility);
    const form: FormDetails = { ...state.form };
    if (selectedFacility) {
      if (!selectedFacility.id) {
        form.referred_to_external = selectedFacility.name ?? "";
        delete form.referred_to;
      } else {
        form.referred_to = selectedFacility.id;
        delete form.referred_to_external;
      }
    }
    dispatch({ type: "set_form", form });
  };

  const handleReferredFromFacilityChange = (
    selected: FacilityModel | FacilityModel[] | null,
  ) => {
    const selectedFacility = selected as FacilityModel;
    setReferredFromFacility(selectedFacility);
    const form: FormDetails = { ...state.form };
    if (selectedFacility) {
      if (!selectedFacility.id) {
        form.referred_from_facility_external = selectedFacility.name ?? "";
        delete form.referred_from_facility;
      } else {
        form.referred_from_facility = selectedFacility.id;
        delete form.referred_from_facility_external;
      }
    }
    dispatch({ type: "set_form", form });
  };

  const field = (name: string) => {
    return {
      id: name,
      name,
      value: (state.form as any)[name],
      error: (state.errors as any)[name],
      onChange: handleFormFieldChange,
      disabled: disabledFields.includes(name),
    };
  };

  const selectField = (name: string) => {
    return {
      ...field(name),
      optionValue: (option: any) => option.id,
      optionLabel: (option: any) => option.text,
      optionDescription: (option: any) => option.desc,
    };
  };

  return (
    <div className="relative flex flex-col pb-2">
      <PageTitle
        className="grow-0 pl-6"
        title={isUpdate ? "Edit Consultation" : "Create Consultation"}
        crumbsReplacements={{
          [facilityId]: { name: facilityName },
          [patientId]: { name: patientName },
        }}
        backUrl={
          id
            ? `/facility/${facilityId}/patient/${patientId}/consultation/${id}`
            : `/facility/${facilityId}/patient/${patientId}`
        }
      />

      <div className="top-0 mt-5 flex grow-0 sm:mx-12">
        <div className="fixed hidden w-72 flex-col xl:flex">
          {Object.keys(sections).map((sectionTitle) => {
            if (!isUpdate && ["Bed Status"].includes(sectionTitle)) {
              return null;
            }

            if (isUpdate && sectionTitle === "Bed Status") {
              return null;
            }

            const isCurrent = currentSection === sectionTitle;
            const section = sections[sectionTitle as ConsultationFormSection];
            return (
              <button
                className={`flex w-full items-center justify-start gap-3 rounded-l-lg px-5 py-3 font-medium ${
                  isCurrent ? "bg-white text-primary-500" : "bg-transparent"
                } transition-all duration-100 ease-in hover:bg-white hover:tracking-wider`}
                onClick={() => {
                  section.ref.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  setCurrentSection(sectionTitle as ConsultationFormSection);
                }}
              >
                <CareIcon icon={section.iconClass} className="text-lg" />
                <span>{sectionTitle}</span>
              </button>
            );
          })}
        </div>
        <div className="flex h-full w-full overflow-auto xl:ml-64 2xl:ml-72">
          <div className="w-full max-w-4xl">
            <form
              onSubmit={handleSubmit}
              className="relative z-10 rounded bg-white p-6 transition-all sm:rounded-xl sm:p-8"
            >
              <DraftSection
                handleDraftSelect={(newState: any) => {
                  dispatch({ type: "set_state", state: newState });
                }}
                formData={state.form}
              />
              <div className="grid grid-cols-1 items-start gap-x-12">
                <div className="grid grid-cols-6 gap-x-6">
                  {sectionTitle("Consultation Details")}
                  <div
                    className="col-span-6"
                    ref={fieldRef["route_to_facility"]}
                  >
                    <RouteToFacilitySelect
                      required
                      label="Route to Facility"
                      {...field("route_to_facility")}
                      disabled={isUpdate && !!state.form.route_to_facility} // For backwards compatibility; Allow in edit form only if route_to_facility is not set previously
                    />
                  </div>

                  {state.form.route_to_facility === 20 && (
                    <>
                      <div
                        id="referred_from_facility"
                        className="col-span-6 mb-5"
                        ref={fieldRef["referred_from_facility"]}
                      >
                        <FieldLabel required>
                          Name of the referring Facility
                        </FieldLabel>
                        <FacilitySelect
                          name="referred_from_facility"
                          searchAll={true}
                          selected={referredFromFacility}
                          setSelected={handleReferredFromFacilityChange}
                          freeText={true}
                          errors={state.errors.referred_from_facility}
                        />
                      </div>
                      <div
                        className="col-span-6"
                        ref={fieldRef["referred_by_external"]}
                      >
                        <TextFormField
                          label="Name of the referring Doctor"
                          placeholder="Enter name of the referring doctor"
                          {...field("referred_by_external")}
                        />
                      </div>
                    </>
                  )}

                  {state.form.route_to_facility === 30 && (
                    <div
                      className="col-span-6"
                      ref={fieldRef["transferred_from_location"]}
                    >
                      <FieldLabel required>
                        Name of Ward/ICU the patient is shifted from
                      </FieldLabel>
                      <LocationSelect
                        name="transferred_from_location"
                        setSelected={(location) =>
                          field("transferred_from_location").onChange({
                            name: "transferred_from_location",
                            value: location,
                          })
                        }
                        selected={field("transferred_from_location").value}
                        showAll={false}
                        multiple={false}
                        facilityId={facilityId}
                        errors={state.errors.transferred_from_location ?? ""}
                      />
                    </div>
                  )}

                  <div
                    className="col-span-6"
                    id="symptoms"
                    ref={fieldRef["create_symptoms"]}
                  >
                    <div className="mb-4 flex flex-col gap-4">
                      <FieldLabel required>Symptoms</FieldLabel>

                      {!isUpdate && (
                        <CheckBoxFormField
                          className="-mt-2 ml-1"
                          {...field("is_asymptomatic")}
                          value={state.form.is_asymptomatic}
                          label="Is the patient Asymptomatic?"
                          errorClassName="hidden"
                        />
                      )}

                      <div
                        className={classNames(
                          state.form.is_asymptomatic &&
                            "pointer-events-none opacity-50",
                        )}
                      >
                        {isUpdate ? (
                          <EncounterSymptomsBuilder />
                        ) : (
                          <CreateSymptomsBuilder
                            value={state.form.create_symptoms}
                            onChange={(symptoms) => {
                              handleFormFieldChange({
                                name: "create_symptoms",
                                value: symptoms,
                              });
                            }}
                          />
                        )}
                        <FieldErrorText error={state.errors.create_symptoms} />
                      </div>
                    </div>
                  </div>

                  <div
                    className="col-span-6"
                    ref={fieldRef["history_of_present_illness"]}
                  >
                    <TextAreaFormField
                      {...field("history_of_present_illness")}
                      label="History of present illness"
                      placeholder="Optional information"
                    />
                  </div>

                  <div
                    className="col-span-6"
                    ref={fieldRef["examination_details"]}
                  >
                    <TextAreaFormField
                      {...field("examination_details")}
                      label="Examination details and Clinical conditions"
                      placeholder="Optional information"
                    />
                  </div>

                  <div className="col-span-6">
                    <div className="flex items-center justify-between">
                      <FieldLabel>Body Surface Area</FieldLabel>
                      <span className="mb-2 text-sm font-medium text-black">
                        {state.form.weight && state.form.height ? (
                          <>
                            {Math.sqrt(
                              (Number(state.form.weight) *
                                Number(state.form.height)) /
                                3600,
                            ).toFixed(2)}
                            m<sup>2</sup>
                          </>
                        ) : (
                          "Not specified"
                        )}
                      </span>
                    </div>

                    <div className="flex flex-col items-center sm:flex-row sm:gap-3">
                      <TextFormField
                        className="w-full"
                        {...field("weight")}
                        type="number"
                        placeholder="Weight"
                        trailingPadding=" "
                        trailing={
                          <p className="absolute right-10 whitespace-nowrap text-sm text-secondary-700">
                            Weight (kg)
                          </p>
                        }
                        min={0}
                      />
                      <TextFormField
                        className="w-full"
                        {...field("height")}
                        type="number"
                        placeholder="Height"
                        trailingPadding=" "
                        trailing={
                          <p className="absolute right-10 whitespace-nowrap text-sm text-secondary-700">
                            Height (cm)
                          </p>
                        }
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="col-span-6" ref={fieldRef["suggestion"]}>
                    <SelectFormField
                      required
                      label="Decision after consultation"
                      {...selectField("suggestion")}
                      options={CONSULTATION_SUGGESTION.filter(
                        (option) => !("deprecated" in option),
                      )}
                      optionDisabled={(option) =>
                        isUpdate && "editDisabled" in option
                      }
                      optionDescription={(option) =>
                        isUpdate && "editDisabled" in option
                          ? t("encounter_suggestion_edit_disallowed")
                          : undefined
                      }
                    />
                  </div>

                  {state.form.suggestion === "R" && (
                    <div
                      id="referred_to"
                      className="col-span-6 mb-5"
                      ref={fieldRef["referred_to"]}
                    >
                      <FieldLabel>Referred To Facility</FieldLabel>
                      <FacilitySelect
                        name="referred_to"
                        searchAll={true}
                        selected={referredToFacility}
                        setSelected={handleReferredToFacilityChange}
                        freeText={true}
                        errors={state.errors.referred_to}
                      />
                    </div>
                  )}

                  {state.form.suggestion === "DD" && (
                    <>
                      <div
                        id="cause_of_death"
                        className="col-span-6"
                        ref={fieldRef["cause_of_death"]}
                      >
                        <TextAreaFormField
                          {...field("cause_of_death")}
                          required={state.form.suggestion === "DD"}
                          label="Cause of Death"
                          value={state.form.cause_of_death}
                        />
                      </div>
                      <div
                        id="death_datetime"
                        className="col-span-6"
                        ref={fieldRef["death_datetime"]}
                      >
                        <DateFormField
                          {...field("death_datetime")}
                          label="Date & Time of Death"
                          required={state.form.suggestion === "DD"}
                          value={
                            !state.form.death_datetime
                              ? new Date()
                              : new Date(state.form.death_datetime)
                          }
                          max={new Date()}
                          onChange={(e) =>
                            field("death_datetime").onChange({
                              ...e,
                              value: dayjs(e.value).format("YYYY-MM-DDTHH:mm"),
                            })
                          }
                          allowTime
                          errorClassName="hidden"
                        />
                      </div>
                      <div
                        id="death_confirmed_doctor"
                        className="col-span-6"
                        ref={fieldRef["death_confirmed_doctor"]}
                      >
                        <TextAreaFormField
                          {...field("death_confirmed_doctor")}
                          required={state.form.suggestion === "DD"}
                          label="Death Confirmed by"
                          value={state.form.death_confirmed_doctor}
                        />
                      </div>
                    </>
                  )}

                  <div
                    className={classNames(
                      "col-span-6",
                      state.form.route_to_facility === 30 && "xl:col-span-3",
                    )}
                    ref={fieldRef["encounter_date"]}
                  >
                    <DateFormField
                      {...field("encounter_date")}
                      required={["A", "DC", "OP"].includes(
                        state.form.suggestion,
                      )}
                      label={t(
                        `encounter_date_field_label__${state.form.suggestion}`,
                      )}
                      value={
                        !state.form.encounter_date
                          ? new Date()
                          : state.form.encounter_date
                      }
                      max={new Date()}
                      min={careConfig.minEncounterDate}
                      onChange={(e) =>
                        field("encounter_date").onChange({
                          ...e,
                          value: dayjs(e.value).format("YYYY-MM-DDTHH:mm"),
                        })
                      }
                      allowTime
                      errorClassName="hidden"
                    />
                    {dayjs().diff(state.form.encounter_date, "day") > 30 && (
                      <div className="mb-6">
                        <span className="font-medium text-warning-500">
                          <CareIcon
                            icon="l-exclamation-triangle"
                            className="pr-2 text-lg"
                          />
                          {t("caution")}:{" "}
                          {t("back_dated_encounter_date_caution")}{" "}
                          <strong className="font-bold">
                            {dayjs(state.form.encounter_date).fromNow()}.
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {state.form.route_to_facility === 30 && (
                    <div
                      className={classNames(
                        "col-span-6",
                        ["A", "DC"].includes(state.form.suggestion) &&
                          "xl:col-span-3",
                      )}
                      ref={fieldRef["icu_admission_date"]}
                    >
                      <DateFormField
                        {...field("icu_admission_date")}
                        label="Date & Time  of admission to the ICU"
                        value={state.form.icu_admission_date || new Date()}
                        onChange={(e) =>
                          field("icu_admission_date").onChange({
                            ...e,
                            value: dayjs(e.value).format("YYYY-MM-DDTHH:mm"),
                          })
                        }
                        allowTime
                        errorClassName="hidden"
                      />
                    </div>
                  )}

                  {state.form.suggestion === "A" && !isUpdate && (
                    <div className="col-span-6 mb-6" ref={fieldRef["bed"]}>
                      <FieldLabel>Bed</FieldLabel>
                      <BedSelect
                        name="bed"
                        setSelected={setBed}
                        selected={bed}
                        error=""
                        multiple={false}
                        unoccupiedOnly={true}
                        facility={facilityId}
                      />
                    </div>
                  )}

                  <div className="col-span-6" ref={fieldRef["patient_no"]}>
                    <TextFormField
                      {...field("patient_no")}
                      label={
                        state.form.suggestion === "A"
                          ? "IP Number"
                          : "OP Number"
                      }
                      required={state.form.suggestion === "A"}
                    />
                  </div>
                  <div className="col-span-6 mb-6" ref={fieldRef["category"]}>
                    <PatientCategorySelect
                      labelSuffix={
                        disabledFields.includes("category") && (
                          <p className="text-xs font-medium text-warning-500">
                            A daily round already exists.
                          </p>
                        )
                      }
                      required
                      label="Category"
                      {...field("category")}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 pb-4">
                  <div className="flex flex-col">
                    {sectionTitle("Diagnosis", true)}
                    <p className="-mt-4 space-x-1 text-sm text-secondary-700">
                      <span>Diagnoses as per ICD-11 recommended by WHO</span>
                    </p>
                  </div>

                  <div ref={fieldRef["diagnoses"]} id="diagnosis-list">
                    {isUpdate ? (
                      <EditDiagnosesBuilder value={state.form.diagnoses} />
                    ) : (
                      <CreateDiagnosesBuilder
                        value={state.form.create_diagnoses}
                        onChange={(diagnoses) => {
                          handleFormFieldChange({
                            name: "create_diagnoses",
                            value: diagnoses,
                          });
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 gap-x-6">
                  {sectionTitle("Treatment Plan")}
                  {state.form.suggestion !== "DD" && (
                    <>
                      <div
                        id="investigation"
                        className="col-span-6"
                        ref={fieldRef["investigation"]}
                      >
                        <FieldLabel>Investigations Suggestions</FieldLabel>
                        <InvestigationBuilder
                          investigations={state.form.InvestigationAdvice}
                          setInvestigations={(investigations) => {
                            handleFormFieldChange({
                              name: "InvestigationAdvice",
                              value: investigations,
                            });
                          }}
                        />
                        <FieldErrorText error={state.errors.investigation} />
                      </div>
                      <div
                        id="procedure"
                        className="col-span-6"
                        ref={fieldRef["procedure"]}
                      >
                        <FieldLabel>{t("procedure_suggestions")}</FieldLabel>
                        <ProcedureBuilder
                          procedures={
                            Array.isArray(state.form.procedure)
                              ? state.form.procedure
                              : []
                          }
                          setProcedures={(procedure) => {
                            handleFormFieldChange({
                              name: "procedure",
                              value: procedure,
                            });
                          }}
                        />
                        <FieldErrorText error={state.errors.procedure} />
                      </div>
                      <div
                        className="col-span-6"
                        ref={fieldRef["treatment_plan"]}
                      >
                        <TextAreaFormField
                          {...field("treatment_plan")}
                          label="Treatment Plan / Treatment Summary"
                          placeholder="Optional information"
                        />
                      </div>
                      <div
                        className="col-span-6"
                        ref={fieldRef["consultation_notes"]}
                      >
                        <TextAreaFormField
                          label="General Instructions (Advice)"
                          placeholder="Consultation Notes"
                          {...field("consultation_notes")}
                        />
                      </div>

                      {careConfig.kasp.enabled && (
                        <CheckBoxFormField
                          {...field("is_kasp")}
                          className="flex-1"
                          required
                          label={careConfig.kasp.string}
                          onChange={handleFormFieldChange}
                        />
                      )}
                      <div
                        className="col-span-6"
                        ref={fieldRef["special_instruction"]}
                      >
                        <TextAreaFormField
                          label="Special Instructions"
                          placeholder="Optional information"
                          {...field("special_instruction")}
                        />
                      </div>
                      <div
                        className="col-span-6"
                        ref={fieldRef["treating_physician"]}
                      >
                        <UserAutocomplete
                          name={"treating_physician"}
                          label={t("treating_doctor")}
                          placeholder="Attending Doctors Name and Designation"
                          required={state.form.suggestion !== "DC"}
                          value={
                            state.form.treating_physician_object ?? undefined
                          }
                          onChange={handleDoctorSelect}
                          userType={"Doctor"}
                          homeFacility={facilityId}
                          error={state.errors.treating_physician}
                          noResultsError={t("no_treating_physicians_available")}
                        />
                      </div>

                      <div className="col-span-6 flex flex-col gap-3 md:flex-row">
                        <div
                          ref={fieldRef["review_interval"]}
                          className="flex-1"
                        >
                          <SelectFormField
                            {...selectField("review_interval")}
                            label="Review After"
                            options={REVIEW_AT_CHOICES}
                            position="above"
                          />
                        </div>
                        <div className="flex-1" ref={fieldRef["action"]}>
                          <SelectFormField
                            {...selectField("action")}
                            label="Action"
                            position="above"
                            options={TELEMEDICINE_ACTIONS}
                            optionLabel={(option) => option.desc}
                            optionDescription={() => ""}
                          />
                        </div>
                      </div>

                      <CheckBoxFormField
                        className="col-span-6"
                        {...field("is_telemedicine")}
                        value={JSON.parse(state.form.is_telemedicine)}
                        label="Would you like to refer the patient for remote monitoring to an external doctor?"
                      />

                      {JSON.parse(state.form.is_telemedicine) && (
                        <div
                          className="col-span-6 flex-[2]"
                          ref={fieldRef["assigned_to"]}
                        >
                          <UserAutocomplete
                            value={state.form.assigned_to_object ?? undefined}
                            onChange={handleDoctorSelect}
                            userType={"Doctor"}
                            name={"assigned_to"}
                            label="Assigned to"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
                  <Cancel
                    onClick={() =>
                      navigate(`/facility/${facilityId}/patient/${patientId}`)
                    }
                  />
                  <Submit
                    onClick={handleSubmit}
                    label={
                      isUpdate ? "Update Consultation" : "Create Consultation"
                    }
                  />
                </div>
              </div>
            </form>
            {state.form.suggestion === "A" && isUpdate && (
              <>
                <div className="mx-auto mt-4 max-w-4xl rounded bg-white px-11 py-8">
                  {sectionTitle("Bed Status")}
                  <Beds
                    facilityId={facilityId}
                    consultationId={id}
                    fetchPatientData={() => refetch()}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
