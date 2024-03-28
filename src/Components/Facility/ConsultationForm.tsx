import * as Notification from "../../Utils/Notifications.js";

import { BedModel, FacilityModel } from "./models";
import {
  CONSULTATION_SUGGESTION,
  DISCHARGE_REASONS,
  ConsultationSuggestionValue,
  PATIENT_CATEGORIES,
  REVIEW_AT_CHOICES,
  TELEMEDICINE_ACTIONS,
} from "../../Common/constants";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import { DraftSection, useAutoSaveReducer } from "../../Utils/AutoSave";
import { FieldErrorText, FieldLabel } from "../Form/FormFields/FormField";
import InvestigationBuilder, {
  InvestigationType,
} from "../Common/prescription-builder/InvestigationBuilder";
import {
  LegacyRef,
  createRef,
  lazy,
  useCallback,
  useEffect,
  useState,
} from "react";
import ProcedureBuilder, {
  ProcedureType,
} from "../Common/prescription-builder/ProcedureBuilder";
import {
  createConsultation,
  getConsultation,
  getPatient,
  updateConsultation,
} from "../../Redux/actions";
import { statusType, useAbortableEffect } from "../../Common/utils";

import { BedSelect } from "../Common/BedSelect";
import Beds from "./Consultations/Beds";
import CareIcon from "../../CAREUI/icons/CareIcon";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";
import DateFormField from "../Form/FormFields/DateFormField";
import { FacilitySelect } from "../Common/FacilitySelect";
import {
  FieldChangeEvent,
  FieldChangeEventHandler,
} from "../Form/FormFields/Utils";
import { FormAction } from "../Form/Utils";
import PatientCategorySelect from "../Patient/PatientCategorySelect";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import { SymptomsSelect } from "../Common/SymptomsSelect";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import UserAutocompleteFormField from "../Common/UserAutocompleteFormField";
import { UserModel } from "../Users/models";
import { dischargePatient } from "../../Redux/actions";

import { navigate } from "raviger";
import useAppHistory from "../../Common/hooks/useAppHistory";
import useConfig from "../../Common/hooks/useConfig";
import { useDispatch } from "react-redux";
import useVisibility from "../../Utils/useVisibility";
import dayjs from "../../Utils/dayjs";
import RouteToFacilitySelect, {
  RouteToFacility,
} from "../Common/RouteToFacilitySelect.js";
import { LocationSelect } from "../Common/LocationSelect.js";
import { classNames } from "../../Utils/utils.js";
import {
  ConditionVerificationStatuses,
  ConsultationDiagnosis,
  CreateDiagnosis,
} from "../Diagnosis/types.js";
import {
  CreateDiagnosesBuilder,
  EditDiagnosesBuilder,
} from "../Diagnosis/ConsultationDiagnosisBuilder/ConsultationDiagnosisBuilder.js";

const Loading = lazy(() => import("../Common/Loading"));
const PageTitle = lazy(() => import("../Common/PageTitle"));

type BooleanStrings = "true" | "false";

type FormDetails = {
  symptoms: number[];
  other_symptoms: string;
  symptoms_onset_date?: Date;
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
  treating_physician_object: UserModel | null;
  create_diagnoses: CreateDiagnosis[];
  diagnoses: ConsultationDiagnosis[];
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
  assigned_to_object: UserModel | null;
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
  symptoms: [],
  other_symptoms: "",
  symptoms_onset_date: undefined,
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
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
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
  {}
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
  const { kasp_enabled, kasp_string } = useConfig();
  const dispatchAction: any = useDispatch();
  const [state, dispatch] = useAutoSaveReducer<FormDetails>(
    consultationFormReducer,
    initialState
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
    "Consultation Details"
  );
  const [consultationDetailsVisible, consultationDetailsRef] = useVisibility();
  const [diagnosisVisible, diagnosisRef] = useVisibility(-300);
  const [treatmentPlanVisible, treatmentPlanRef] = useVisibility(-300);
  const [bedStatusVisible, bedStatusRef] = useVisibility(-300);
  const [disabledFields, setDisabledFields] = useState<string[]>([]);

  const { min_encounter_date } = useConfig();

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

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        setIsLoading(true);
        const res = await dispatchAction(getPatient({ id: patientId }));
        if (res.data) {
          if (isUpdate) {
            dispatch({
              type: "set_form",
              form: { ...state.form, action: res.data.action },
            });
          }
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
      if (!id) setIsLoading(false);
    }
    fetchPatientName();
  }, [dispatchAction, patientId]);

  useEffect(() => {
    dispatch({
      type: "set_form",
      form: { ...state.form, encounter_date: new Date() },
    });
  }, []);

  const hasSymptoms =
    !!state.form.symptoms.length && !state.form.symptoms.includes(1);
  const isOtherSymptomsSelected = state.form.symptoms.includes(9);

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
    } else {
      dispatch({
        type: "set_form",
        form: { ...state.form, [event.name]: event.value },
      });
    }
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      if (!patientId) setIsLoading(true);
      const res = await dispatchAction(getConsultation(id!));
      handleFormFieldChange({
        name: "InvestigationAdvice",
        value: !Array.isArray(res.data.investigation)
          ? []
          : res.data.investigation,
      });
      handleFormFieldChange({
        name: "procedures",
        value: !Array.isArray(res.data.procedure) ? [] : res.data.procedure,
      });
      if (res.data.suggestion === "R") {
        if (res.data.referred_to_external)
          setReferredToFacility({
            id: -1,
            name: res.data.referred_to_external,
          });
        else setReferredToFacility(res.data.referred_to_object);
      }
      if (res.data.route_to_facility === 20) {
        if (res.data.referred_from_facility_external)
          setReferredFromFacility({
            id: -1,
            name: res.data.referred_from_facility_external,
          });
        else setReferredFromFacility(res.data.referred_from_facility_object);
      }
      if (!status.aborted) {
        if (res?.data) {
          const formData = {
            ...res.data,
            symptoms_onset_date: isoStringToDate(res.data.symptoms_onset_date),
            encounter_date: isoStringToDate(res.data.encounter_date),
            icu_admission_date: isoStringToDate(res.data.icu_admission_date),
            admitted: res.data.admitted ? String(res.data.admitted) : "false",
            admitted_to: res.data.admitted_to ? res.data.admitted_to : "",
            category: res.data.category
              ? PATIENT_CATEGORIES.find((i) => i.text === res.data.category)
                  ?.id ?? ""
              : "",
            patient_no: res.data.patient_no ?? "",
            OPconsultation: res.data.consultation_notes,
            is_telemedicine: `${res.data.is_telemedicine}`,
            is_kasp: `${res.data.is_kasp}`,
            assigned_to: res.data.assigned_to || "",
            assigned_to_object: res.data.assigned_to_object,
            treating_physician: res.data.treating_physician || "",
            treating_physician_object: res.data.treating_physician_object,
            ett_tt: res.data.ett_tt ? Number(res.data.ett_tt) : 3,
            special_instruction: res.data.special_instruction || "",
            weight: res.data.weight ? res.data.weight : "",
            height: res.data.height ? res.data.height : "",
            bed: res.data?.current_bed?.bed_object || null,
            new_discharge_reason: res.data?.new_discharge_reason || null,
            cause_of_death: res.data?.discharge_notes || "",
            death_datetime: res.data?.death_datetime || "",
            death_confirmed_doctor: res.data?.death_confirmed_doctor || "",
            InvestigationAdvice: Array.isArray(res.data.investigation)
              ? res.data.investigation
              : [],
            diagnoses: res.data.diagnoses.sort(
              (a: ConsultationDiagnosis, b: ConsultationDiagnosis) =>
                ConditionVerificationStatuses.indexOf(a.verification_status) -
                ConditionVerificationStatuses.indexOf(b.verification_status)
            ),
          };
          dispatch({ type: "set_form", form: { ...state.form, ...formData } });
          setBed(formData.bed);

          if (res.data.last_daily_round && state.form.category) {
            setDisabledFields((fields) => [...fields, "category"]);
          }
        } else {
          goBack();
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, id, patientName, patientId]
  );

  useAbortableEffect(
    (status: statusType) => {
      if (id && ((patientId && patientName) || !patientId)) fetchData(status);
    },
    [fetchData, id, patientId, patientName]
  );

  if (isLoading) return <Loading />;

  const validateForm = () => {
    const errors = { ...initError };
    let invalidForm = false;

    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "symptoms":
          if (!state.form[field] || !state.form[field].length) {
            errors[field] = "Please select the symptoms";
            invalidForm = true;
          }
          return;
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
            errors[field] = "Field is required";
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
        case "other_symptoms":
          if (isOtherSymptomsSelected && !state.form[field]) {
            errors[field] = "Please enter the other symptom details";
            invalidForm = true;
          }
          return;
        case "symptoms_onset_date":
          if (hasSymptoms && !state.form[field]) {
            errors[field] = "Please enter date of onset of the above symptoms";
            invalidForm = true;
          }
          return;
        case "encounter_date":
          if (!state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          if (
            min_encounter_date &&
            dayjs(state.form.encounter_date).isBefore(dayjs(min_encounter_date))
          ) {
            errors[
              field
            ] = `Admission date cannot be before ${min_encounter_date}`;
            invalidForm = true;
          }
          return;
        case "cause_of_death":
          if (state.form.suggestion === "DD" && !state.form[field]) {
            errors[field] = "Please enter cause of death";
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
        case "consultation_notes":
          if (!state.form[field]) {
            errors[field] = "Field is required";
            invalidForm = true;
          } else if (!state.form[field].replace(/\s/g, "").length) {
            errors[field] = "Consultation notes can not be empty";
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
            errors[
              field
            ] = `Please select an option, ${kasp_string} is mandatory`;
            invalidForm = true;
          }
          return;
        case "procedure": {
          for (const p of state.form.procedures) {
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
          if (state.form.suggestion !== "DD" && !state.form[field]) {
            errors[field] = "Please fill treating physician";
            invalidForm = true;
            break;
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
    death_confirmed_doctor: string
  ) => {
    const dischargeResponse = await dispatchAction(
      dischargePatient(
        {
          new_discharge_reason: DISCHARGE_REASONS.find(
            (i) => i.text === "Expired"
          )?.id,
          discharge_notes: cause_of_death,
          death_datetime: death_datetime,
          death_confirmed_doctor: death_confirmed_doctor,
          discharge_date: dayjs().toISOString(),
        },
        { id }
      )
    );

    if (dischargeResponse?.status === 200) {
      return dischargeResponse;
    }
  };

  const handleSubmit = async (
    e:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    const validated = validateForm();
    if (validated) {
      setIsLoading(true);
      const data: any = {
        symptoms: state.form.symptoms,
        other_symptoms: isOtherSymptomsSelected
          ? state.form.other_symptoms
          : undefined,
        symptoms_onset_date: hasSymptoms
          ? state.form.symptoms_onset_date
          : undefined,
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
        treating_physician: state.form.treating_physician,
        investigation: state.form.InvestigationAdvice,
        procedure: state.form.procedures,
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

      const res = await dispatchAction(
        id ? updateConsultation(id!, data) : createConsultation(data)
      );
      setIsLoading(false);
      if (res?.data && res.status !== 400) {
        dispatch({ type: "set_form", form: initForm });

        if (data.suggestion === "DD") {
          await declareThePatientDead(
            res.data.id,
            state.form.cause_of_death,
            state.form.death_datetime,
            state.form.death_confirmed_doctor
          );
        }

        Notification.Success({
          msg: res.data.discharge_date
            ? "Patient discharged successfully"
            : `Consultation ${id ? "updated" : "created"} successfully`,
        });

        navigate(
          `/facility/${facilityId}/patient/${patientId}/consultation/${res.data.id}`
        );

        if (data.suggestion === "R") {
          navigate(`/facility/${facilityId}/patient/${patientId}/shift/new`);
          return;
        } else if (!id && data.suggestion === "A") {
          navigate(
            `/facility/${facilityId}/patient/${patientId}/consultation/${res.data.id}/prescriptions`
          );
        }
      }
    }
  };

  const handleDoctorSelect = (event: FieldChangeEvent<UserModel | null>) => {
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
    required = false
  ) => {
    const section = sections[sectionTitle];
    return (
      <div
        id={sectionId(sectionTitle)}
        className="col-span-6 -ml-2 mb-6 flex flex-row items-center"
        ref={section.ref as LegacyRef<HTMLDivElement>}
      >
        <CareIcon icon={section.iconClass} className="mr-3 text-xl" />
        <label className="text-lg font-bold text-gray-900">
          {sectionTitle}
          {required && <span className="text-danger-500">{" *"}</span>}
        </label>
        <hr className="ml-6 flex-1 border border-gray-400" />
      </div>
    );
  };

  const handleReferredToFacilityChange = (
    selected: FacilityModel | FacilityModel[] | null
  ) => {
    const selectedFacility = selected as FacilityModel;
    setReferredToFacility(selectedFacility);
    const form: FormDetails = { ...state.form };
    if (selectedFacility?.id) {
      if (selectedFacility.id === -1) {
        form.referred_to_external = selectedFacility.name ?? "";
        delete form.referred_to;
      } else {
        form.referred_to = selectedFacility.id.toString() || "";
        delete form.referred_to_external;
      }
    }
    dispatch({ type: "set_form", form });
  };

  const handleReferredFromFacilityChange = (
    selected: FacilityModel | FacilityModel[] | null
  ) => {
    const selectedFacility = selected as FacilityModel;
    setReferredFromFacility(selectedFacility);
    const form: FormDetails = { ...state.form };
    if (selectedFacility?.id) {
      if (selectedFacility.id === -1) {
        form.referred_from_facility_external = selectedFacility.name ?? "";
        delete form.referred_from_facility;
      } else {
        form.referred_from_facility = selectedFacility.id.toString() || "";
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
        <div className="fixed hidden h-full w-72 flex-col xl:flex">
          {Object.keys(sections).map((sectionTitle) => {
            if (!isUpdate && sectionTitle === "Bed Status") {
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
        <div className="flex h-full w-full overflow-auto xl:ml-72">
          <div className="w-full max-w-4xl">
            <form
              onSubmit={handleSubmit}
              className="rounded bg-white p-6 transition-all sm:rounded-xl sm:p-12"
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

                  <div className="col-span-6" ref={fieldRef["symptoms"]}>
                    <SymptomsSelect
                      required
                      label="Symptoms"
                      {...field("symptoms")}
                    />
                  </div>
                  {isOtherSymptomsSelected && (
                    <div
                      className="col-span-6"
                      ref={fieldRef["other_symptoms"]}
                    >
                      <TextAreaFormField
                        {...field("other_symptoms")}
                        label="Other symptom details"
                        required
                        placeholder="Enter details of other symptoms here"
                      />
                    </div>
                  )}

                  {hasSymptoms && (
                    <div
                      className="col-span-6"
                      ref={fieldRef["symptoms_onset_date"]}
                    >
                      <DateFormField
                        {...field("symptoms_onset_date")}
                        disableFuture
                        required
                        label="Date of onset of the symptoms"
                        position="LEFT"
                      />
                    </div>
                  )}
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
                        {Math.sqrt(
                          (Number(state.form.weight) *
                            Number(state.form.height)) /
                            3600
                        ).toFixed(2)}
                        m<sup>2</sup>
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
                          <p className="mr-8 text-sm text-gray-700">
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
                          <p className="mr-8 text-sm text-gray-700">
                            Height (cm)
                          </p>
                        }
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="col-span-6" ref={fieldRef["category"]}>
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

                  <div className="col-span-6" ref={fieldRef["suggestion"]}>
                    <SelectFormField
                      required
                      label="Decision after consultation"
                      {...selectField("suggestion")}
                      options={CONSULTATION_SUGGESTION.filter(
                        (option) => !("deprecated" in option)
                      )}
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
                        <TextFormField
                          {...field("death_datetime")}
                          type="datetime-local"
                          max={dayjs().format("YYYY-MM-DDTHH:mm")}
                          required={state.form.suggestion === "DD"}
                          label="Date & Time of Death"
                          value={state.form.death_datetime}
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
                      state.form.route_to_facility === 30 && "xl:col-span-3"
                    )}
                    ref={fieldRef["encounter_date"]}
                  >
                    <TextFormField
                      {...field("encounter_date")}
                      required={["A", "DC", "OP"].includes(
                        state.form.suggestion
                      )}
                      label={
                        {
                          A: "Date & Time of Admission to the Facility",
                          DC: "Date & Time of Domiciliary Care commencement",
                          OP: "Date & Time of Out-patient visit",
                          DD: "Date & Time of Consultation",
                          HI: "Date & Time of Consultation",
                          R: "Date & Time of Consultation",
                        }[state.form.suggestion]
                      }
                      type="datetime-local"
                      value={dayjs(state.form.encounter_date).format(
                        "YYYY-MM-DDTHH:mm"
                      )}
                      max={dayjs().format("YYYY-MM-DDTHH:mm")}
                      min={
                        min_encounter_date
                          ? dayjs(min_encounter_date).format("YYYY-MM-DDTHH:mm")
                          : undefined
                      }
                    />
                  </div>

                  {state.form.route_to_facility === 30 && (
                    <div
                      className={classNames(
                        "col-span-6",
                        ["A", "DC"].includes(state.form.suggestion) &&
                          "xl:col-span-3"
                      )}
                      ref={fieldRef["icu_admission_date"]}
                    >
                      <TextFormField
                        {...field("icu_admission_date")}
                        label="Date & Time  of admission to the ICU"
                        type="datetime-local"
                        value={
                          state.form.icu_admission_date &&
                          dayjs(state.form.icu_admission_date).format(
                            "YYYY-MM-DDTHH:mm"
                          )
                        }
                      />
                    </div>
                  )}

                  {["A", "DC"].includes(state.form.suggestion) && !isUpdate && (
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

                  <div className="col-span-6 mb-6" ref={fieldRef["patient_no"]}>
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
                </div>

                <div className="flex flex-col gap-4 pb-4">
                  <div className="flex flex-col">
                    {sectionTitle("Diagnosis", true)}
                    <p className="-mt-4 space-x-1 text-sm text-gray-700">
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
                        <FieldLabel>Procedures</FieldLabel>
                        <ProcedureBuilder
                          procedures={state.form.procedures}
                          setProcedures={(procedures) => {
                            handleFormFieldChange({
                              name: "procedures",
                              value: procedures,
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
                          required
                          placeholder="Consultation Notes"
                          {...field("consultation_notes")}
                        />
                      </div>

                      {kasp_enabled && (
                        <CheckBoxFormField
                          {...field("is_kasp")}
                          className="flex-1"
                          required
                          label={kasp_string}
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
                        <UserAutocompleteFormField
                          name={"treating_physician"}
                          label="Treating Physician"
                          placeholder="Attending Doctors Name and Designation"
                          required
                          value={
                            state.form.treating_physician_object ?? undefined
                          }
                          onChange={handleDoctorSelect}
                          showActiveStatus
                          userType={"Doctor"}
                          homeFacility={facilityId}
                          error={state.errors.treating_physician}
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
                          <UserAutocompleteFormField
                            showActiveStatus
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
            {isUpdate && (
              <>
                <div className="mx-auto mt-4 max-w-4xl rounded bg-white px-11 py-8">
                  {sectionTitle("Bed Status")}
                  <Beds
                    facilityId={facilityId}
                    patientId={patientId}
                    consultationId={id}
                    fetchPatientData={fetchData}
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
