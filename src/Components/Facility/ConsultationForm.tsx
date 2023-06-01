import loadable from "@loadable/component";
import { navigate } from "raviger";
import moment from "moment";
import {
  createRef,
  LegacyRef,
  useCallback,
  useEffect,
  useReducer,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import {
  CONSULTATION_SUGGESTION,
  PATIENT_CATEGORIES,
  TELEMEDICINE_ACTIONS,
  REVIEW_AT_CHOICES,
  CONSULTATION_STATUS,
} from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  createConsultation,
  getConsultation,
  updateConsultation,
  getPatient,
} from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { FacilitySelect } from "../Common/FacilitySelect";
import { LegacyErrorHelperText } from "../Common/HelperInputFields";
import { BedModel, FacilityModel } from "./models";
import { OnlineUsersSelect } from "../Common/OnlineUsersSelect";
import { UserModel } from "../Users/models";
import { BedSelect } from "../Common/BedSelect";
import { dischargePatient } from "../../Redux/actions";
import Beds from "./Consultations/Beds";
import InvestigationBuilder, {
  InvestigationType,
} from "../Common/prescription-builder/InvestigationBuilder";
import ProcedureBuilder, {
  ProcedureType,
} from "../Common/prescription-builder/ProcedureBuilder";
import { ICD11DiagnosisModel } from "./models";
import { Cancel, Submit } from "../Common/components/ButtonV2";
import TextAreaFormField from "../Form/FormFields/TextAreaFormField";
import { FieldChangeEventHandler } from "../Form/FormFields/Utils";
import { FieldLabel } from "../Form/FormFields/FormField";
import PatientCategorySelect from "../Patient/PatientCategorySelect";
import { SelectFormField } from "../Form/FormFields/SelectFormField";
import TextFormField from "../Form/FormFields/TextFormField";
import { DiagnosisSelectFormField } from "../Common/DiagnosisSelectFormField";
import { SymptomsSelect } from "../Common/SymptomsSelect";
import DateFormField from "../Form/FormFields/DateFormField";
import useConfig from "../../Common/hooks/useConfig";
import useAppHistory from "../../Common/hooks/useAppHistory";
import useVisibility from "../../Utils/useVisibility";
import CareIcon from "../../CAREUI/icons/CareIcon";
import CheckBoxFormField from "../Form/FormFields/CheckBoxFormField";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

type BooleanStrings = "true" | "false";

type FormDetails = {
  symptoms: number[];
  other_symptoms: string;
  symptoms_onset_date?: Date;
  suggestion: string;
  consultation_status: number;
  patient: string;
  facility: string;
  admitted: BooleanStrings;
  admitted_to: string;
  category: string;
  admission_date?: Date;
  discharge_date: null;
  referred_to?: string;
  referred_to_external?: string;
  icd11_diagnoses_object: ICD11DiagnosisModel[];
  icd11_provisional_diagnoses_object: ICD11DiagnosisModel[];
  verified_by: string;
  is_kasp: BooleanStrings;
  kasp_enabled_date: null;
  examination_details: string;
  history_of_present_illness: string;
  prescribed_medication: string;
  consultation_notes: string;
  ip_no: string;
  op_no: string;
  procedure: ProcedureType[];
  investigation: InvestigationType[];
  is_telemedicine: BooleanStrings;
  action?: string;
  assigned_to: string;
  assigned_to_object: UserModel | null;
  special_instruction: string;
  review_interval: number;
  weight: string;
  height: string;
  bed: BedModel | null;
  discharge_reason: string;
  cause_of_death: string;
  death_datetime: string;
  death_confirmed_doctor: string;
};

type Action =
  | { type: "set_form"; form: FormDetails }
  | { type: "set_error"; errors: FormDetails }
  | { type: "set_form_field"; field: keyof FormDetails; value: any };

const initForm: FormDetails = {
  symptoms: [],
  other_symptoms: "",
  symptoms_onset_date: undefined,
  suggestion: "A",
  consultation_status: 0,
  patient: "",
  facility: "",
  admitted: "false",
  admitted_to: "",
  category: "Comfort",
  admission_date: new Date(),
  discharge_date: null,
  referred_to: "",
  referred_to_external: "",
  icd11_diagnoses_object: [],
  icd11_provisional_diagnoses_object: [],
  verified_by: "",
  is_kasp: "false",
  kasp_enabled_date: null,
  examination_details: "",
  history_of_present_illness: "",
  prescribed_medication: "",
  consultation_notes: "",
  ip_no: "",
  op_no: "",
  procedure: [],
  investigation: [],
  is_telemedicine: "false",
  action: "NO_ACTION",
  assigned_to: "",
  assigned_to_object: null,
  special_instruction: "",
  review_interval: -1,
  weight: "",
  height: "",
  bed: null,
  discharge_reason: "",
  cause_of_death: "",
  death_datetime: "",
  death_confirmed_doctor: "",
};

const initError = Object.assign(
  {},
  ...Object.keys(initForm).map((k) => ({ [k]: "" }))
);

const isoStringToDate = (isoDate: string) =>
  (moment(isoDate).isValid() && moment(isoDate).toDate()) || undefined;

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

const consultationFormReducer = (state = initialState, action: Action) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: { ...state.form, ...action.form },
      };
    }
    case "set_error": {
      return {
        ...state,
        errors: action.errors,
      };
    }
    case "set_form_field": {
      return {
        ...state,
        form: {
          ...state.form,
          [action.field]: action.value,
        },
      };
    }
  }
};

type ConsultationFormSection =
  | "Consultation Details"
  | "Diagnosis"
  | "Treatment Plan";

export const ConsultationForm = (props: any) => {
  const { goBack } = useAppHistory();
  const { kasp_enabled, kasp_string } = useConfig();
  const dispatchAction: any = useDispatch();
  const { facilityId, patientId, id } = props;
  const [state, dispatch] = useReducer(consultationFormReducer, initialState);
  const [bed, setBed] = useState<BedModel | BedModel[] | null>(null);
  const [InvestigationAdvice, setInvestigationAdvice] = useState<
    InvestigationType[]
  >([]);
  const [procedures, setProcedures] = useState<ProcedureType[]>([]);

  const [selectedFacility, setSelectedFacility] =
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

  const sections = {
    "Consultation Details": {
      iconClass: "care-l-medkit",
      visible: consultationDetailsVisible,
      ref: consultationDetailsRef,
    },
    Diagnosis: {
      iconClass: "care-l-stethoscope",
      visible: diagnosisVisible,
      ref: diagnosisRef,
    },
    "Treatment Plan": {
      iconClass: "care-l-clipboard-alt",
      visible: treatmentPlanVisible,
      ref: treatmentPlanRef,
    },
  };

  useEffect(() => {
    setCurrentSection((prev) => {
      if (consultationDetailsVisible) return "Consultation Details";
      if (diagnosisVisible) return "Diagnosis";
      if (treatmentPlanVisible) return "Treatment Plan";
      return prev;
    });
  }, [consultationDetailsVisible, diagnosisVisible, treatmentPlanVisible]);

  useEffect(() => {
    async function fetchPatientName() {
      if (patientId) {
        const res = await dispatchAction(getPatient({ id: patientId }));
        if (res.data) {
          setPatientName(res.data.name);
          setFacilityName(res.data.facility_object.name);
          if (isUpdate) {
            dispatch({
              type: "set_form_field",
              field: "action",
              value: TELEMEDICINE_ACTIONS.find((a) => a.id === res.data.action)
                ?.text,
            });
          }
        }
      } else {
        setPatientName("");
        setFacilityName("");
      }
    }
    fetchPatientName();
  }, [dispatchAction, patientId]);

  const hasSymptoms =
    !!state.form.symptoms.length && !state.form.symptoms.includes(1);
  const isOtherSymptomsSelected = state.form.symptoms.includes(9);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatchAction(getConsultation(id));
      setInvestigationAdvice(
        !Array.isArray(res.data.investigation) ? [] : res.data.investigation
      );
      setProcedures(
        !Array.isArray(res.data.procedure) ? [] : res.data.procedure
      );
      if (res.data.suggestion === "R") {
        if (res.data.referred_to_external)
          setSelectedFacility({ id: -1, name: res.data.referred_to_external });
        else setSelectedFacility(res.data.referred_to_object);
      }
      if (!status.aborted) {
        if (res && res.data) {
          const formData = {
            ...res.data,
            symptoms_onset_date: isoStringToDate(res.data.symptoms_onset_date),
            admission_date: isoStringToDate(res.data.admission_date),
            admitted: res.data.admitted ? String(res.data.admitted) : "false",
            admitted_to: res.data.admitted_to ? res.data.admitted_to : "",
            category: res.data.category
              ? PATIENT_CATEGORIES.find((i) => i.text === res.data.category)
                  ?.id || "Comfort"
              : "Comfort",
            ip_no: res.data.ip_no ? res.data.ip_no : "",
            op_no: res.data.op_no ? res.data.op_no : "",
            verified_by: res.data.verified_by ? res.data.verified_by : "",
            OPconsultation: res.data.consultation_notes,
            is_telemedicine: `${res.data.is_telemedicine}`,
            is_kasp: `${res.data.is_kasp}`,
            assigned_to: res.data.assigned_to || "",
            ett_tt: res.data.ett_tt ? Number(res.data.ett_tt) : 3,
            special_instruction: res.data.special_instruction || "",
            weight: res.data.weight ? res.data.weight : "",
            height: res.data.height ? res.data.height : "",
            bed: res.data?.current_bed?.bed_object || null,
            discharge_reason: res.data?.discharge_reason || "",
            cause_of_death: res.data?.discharge_notes || "",
            death_datetime: res.data?.death_datetime || "",
            death_confirmed_doctor: res.data?.death_confirmed_doctor || "",
          };
          dispatch({ type: "set_form", form: formData });
          setBed(formData.bed);
        } else {
          goBack();
        }
        setIsLoading(false);
      }
    },
    [dispatchAction, id]
  );

  useAbortableEffect(
    (status: statusType) => {
      if (id) {
        fetchData(status);
      }
    },
    [fetchData, id]
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
        case "consultation_status":
          if (!state.form[field]) {
            errors[field] = "Please select the consultation status";
            invalidForm = true;
          }
          return;
        case "ip_no":
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
        case "admission_date":
          if (state.form.suggestion === "A" && !state.form[field]) {
            errors[field] = "Field is required as person is admitted";
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
        case "consultation_notes":
          if (state.form.consultation_status != 1) {
            if (!state.form[field]) {
              errors[field] = "Required *";
              invalidForm = true;
            } else if (!state.form[field].replace(/\s/g, "").length) {
              errors[field] = "Consultation notes can not be empty";
              invalidForm = true;
            }
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
          for (const p of procedures) {
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
          for (const i of InvestigationAdvice) {
            if (!i.type?.length) {
              errors[field] = "Investigation field can not be empty";
              invalidForm = true;
              break;
            }
            if (i.repetitive && !i.frequency?.replace(/\s/g, "").length) {
              errors[field] = "Frequency field can not be empty";
              invalidForm = true;
              break;
            }
          }
          return;
        }

        case "verified_by": {
          if (!state.form[field].replace(/\s/g, "").length) {
            errors[field] = "Please fill verified by";
            invalidForm = true;
            break;
          }
          return;
        }

        case "icd11_provisional_diagnoses_object": {
          if (
            state.form[field].length === 0 &&
            state.form["icd11_diagnoses_object"].length === 0
          ) {
            for (const err_field of [field, "icd11_diagnoses_object"])
              errors[err_field] =
                "Please select either Provisional Diagnosis or Final Diagnosis";
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
      dispatch({ type: "set_error", errors });
      const firstError = Object.keys(errors).find((key) => errors[key]);
      if (firstError) {
        fieldRef[firstError].current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return false;
    }
    dispatch({ type: "set_error", errors });
    return true;
  };

  const declareThePatientDead = async (
    cause_of_death: string,
    death_datetime: string,
    death_confirmed_doctor: string
  ) => {
    const dischargeResponse = await dispatchAction(
      dischargePatient(
        {
          discharge_reason: "EXP",
          discharge_notes: cause_of_death,
          death_datetime: death_datetime,
          death_confirmed_doctor: death_confirmed_doctor,
        },
        { id }
      )
    );

    if (dischargeResponse?.status === 200) {
      return dischargeResponse;
    }
  };

  const getNotificationMessage = () => {
    if (state.form.suggestion !== "A") return "Patient discharged successfully";

    return `Consultation ${id ? "updated" : "created"} successfully`;
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
      const data = {
        symptoms: state.form.symptoms,
        other_symptoms: isOtherSymptomsSelected
          ? state.form.other_symptoms
          : undefined,
        symptoms_onset_date: hasSymptoms
          ? state.form.symptoms_onset_date
          : undefined,
        suggestion: state.form.suggestion,
        consultation_status: Number(state.form.consultation_status),
        admitted: state.form.suggestion === "A",
        admission_date:
          state.form.suggestion === "A" ? state.form.admission_date : undefined,
        category: state.form.category,
        is_kasp: state.form.is_kasp,
        kasp_enabled_date: JSON.parse(state.form.is_kasp) ? new Date() : null,
        examination_details: state.form.examination_details,
        history_of_present_illness: state.form.history_of_present_illness,
        prescribed_medication: state.form.prescribed_medication,
        discharge_date: state.form.discharge_date,
        ip_no: state.form.ip_no,
        op_no: state.form.op_no,
        icd11_diagnoses: state.form.icd11_diagnoses_object.map((o) => o.id),
        icd11_provisional_diagnoses:
          state.form.icd11_provisional_diagnoses_object.map((o) => o.id),
        verified_by: state.form.verified_by,
        investigation: InvestigationAdvice,
        procedure: procedures,
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
        consultation_notes: state.form.consultation_notes,
        is_telemedicine: state.form.is_telemedicine,
        action: state.form.action,
        review_interval: state.form.review_interval,
        assigned_to:
          state.form.is_telemedicine === "true" ? state.form.assigned_to : "",
        special_instruction: state.form.special_instruction,
        weight: Number(state.form.weight),
        height: Number(state.form.height),
        bed: bed && bed instanceof Array ? bed[0]?.id : bed?.id,
      };

      const res = await dispatchAction(
        id ? updateConsultation(id, data) : createConsultation(data)
      );
      setIsLoading(false);
      if (res && res.data && res.status !== 400) {
        dispatch({ type: "set_form", form: initForm });

        if (data.suggestion === "DD") {
          await declareThePatientDead(
            state.form.cause_of_death,
            state.form.death_datetime,
            state.form.death_confirmed_doctor
          );
        }

        Notification.Success({
          msg: getNotificationMessage(),
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

  const handleFormFieldChange: FieldChangeEventHandler<unknown> = (event) => {
    if (event.name === "consultation_status" && event.value === "1") {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          consultation_status: 1,
          symptoms: [1],
          symptoms_onset_date: new Date(),
          category: "Critical",
          suggestion: "DD",
          verified_by: "Brought Dead",
        },
      });
    } else if (event.name === "suggestion" && event.value === "DD") {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          suggestion: "DD",
          consultation_notes: "Patient declared dead",
          verified_by: "Declared Dead",
        },
      });
    } else {
      dispatch({
        type: "set_form",
        form: { ...state.form, [event.name]: event.value },
      });
    }
  };

  const handleDoctorSelect = (doctor: UserModel | null) => {
    if (doctor?.id) {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          assigned_to: doctor.id.toString(),
          assigned_to_object: doctor,
        },
      });
    } else {
      dispatch({
        type: "set_form",
        form: {
          ...state.form,
          assigned_to: "",
          assigned_to_object: null,
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
        className="col-span-6 flex flex-row items-center mb-6 -ml-2"
        ref={section.ref as LegacyRef<HTMLDivElement>}
      >
        <CareIcon className={`${section.iconClass} text-xl mr-3`} />
        <label className="font-bold text-lg text-gray-900">
          {sectionTitle}
          {required && <span className="text-danger-500">{" *"}</span>}
        </label>
        <hr className="ml-6 flex-1 border-gray-400 border" />
      </div>
    );
  };

  const setFacility = (selected: FacilityModel | FacilityModel[] | null) => {
    const selectedFacility = selected as FacilityModel;
    setSelectedFacility(selectedFacility);
    const form: FormDetails = { ...state.form };
    if (selectedFacility && selectedFacility.id) {
      if (selectedFacility.id === -1) {
        form.referred_to_external = selectedFacility.name || "";
        delete form.referred_to;
      } else {
        form.referred_to = selectedFacility.id.toString() || "";
        delete form.referred_to_external;
      }
    }
    dispatch({ type: "set_form", form });
  };

  const field = (name: string) => {
    return {
      id: name,
      name,
      value: (state.form as any)[name],
      error: state.errors[name],
      onChange: handleFormFieldChange,
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
    <div className="pb-2 relative flex flex-col">
      <PageTitle
        className="pl-6 flex-grow-0"
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

      <div className="mt-5 flex top-0 sm:mx-12 flex-grow-0">
        <div className="hidden xl:flex flex-col w-72 fixed h-full">
          {Object.keys(sections).map((sectionTitle) => {
            if (state.form.consultation_status === 1) {
              return null;
            }
            const isCurrent = currentSection === sectionTitle;
            const section = sections[sectionTitle as ConsultationFormSection];
            return (
              <button
                className={`rounded-l-lg flex items-center justify-start gap-3 px-5 py-3 w-full font-medium ${
                  isCurrent ? "bg-white text-primary-500" : "bg-transparent"
                } hover:bg-white hover:tracking-wider transition-all duration-100 ease-in`}
                onClick={() => {
                  section.ref.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  setCurrentSection(sectionTitle as ConsultationFormSection);
                }}
              >
                <CareIcon className={`${section.iconClass} text-lg`} />
                <span>{sectionTitle}</span>
              </button>
            );
          })}
        </div>
        <div className="w-full h-full flex overflow-auto xl:ml-72">
          <div className="w-full max-w-4xl">
            <form
              onSubmit={handleSubmit}
              className="rounded sm:rounded-xl bg-white p-6 sm:p-12 transition-all"
            >
              <div className="grid grid-cols-1 gap-x-12 items-start">
                <div className="grid grid-cols-6 gap-x-6">
                  {sectionTitle("Consultation Details")}
                  <div
                    className="col-span-6"
                    ref={fieldRef["consultation_status"]}
                  >
                    <SelectFormField
                      required
                      label="Status during the consultation"
                      {...selectField("consultation_status")}
                      options={CONSULTATION_STATUS}
                    />
                  </div>

                  {String(state.form.consultation_status) !== "1" && (
                    <>
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
                    </>
                  )}

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
                      <span className="mb-2 text-black font-medium text-sm">
                        {Math.sqrt(
                          (Number(state.form.weight) *
                            Number(state.form.height)) /
                            3600
                        ).toFixed(2)}
                        m<sup>2</sup>
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:gap-3">
                      <TextFormField
                        className="w-full"
                        {...field("weight")}
                        type="number"
                        placeholder="Weight"
                        trailingPadding=" "
                        trailing={
                          <p className="text-sm text-gray-700 mr-8">
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
                          <p className="text-sm text-gray-700 mr-8">
                            Height (cm)
                          </p>
                        }
                        min={0}
                      />
                    </div>
                  </div>

                  {String(state.form.consultation_status) !== "1" && (
                    <div className="col-span-6" ref={fieldRef["category"]}>
                      <PatientCategorySelect
                        required
                        label="Category"
                        {...field("category")}
                      />
                    </div>
                  )}

                  <div
                    className="col-span-6"
                    ref={fieldRef["consultation_status"]}
                  >
                    <SelectFormField
                      required
                      label="Decision after consultation"
                      disabled={String(state.form.consultation_status) === "1"}
                      {...selectField("suggestion")}
                      options={CONSULTATION_SUGGESTION}
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
                        selected={selectedFacility}
                        setSelected={setFacility}
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
                          max={new Date().toISOString().slice(0, 16)}
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

                  {state.form.suggestion === "A" && (
                    <>
                      <div
                        className="col-span-6"
                        ref={fieldRef["admission_date"]}
                      >
                        <DateFormField
                          {...field("admission_date")}
                          required
                          label="Admission date"
                          position="LEFT"
                        />
                      </div>

                      {!isUpdate && (
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
                    </>
                  )}
                  {state.form.suggestion !== "A" ? (
                    <div className="col-span-6 mb-6" ref={fieldRef["op_no"]}>
                      <TextFormField {...field("op_no")} label="OP Number" />
                    </div>
                  ) : (
                    <div className="col-span-6 mb-6" ref={fieldRef["ip_no"]}>
                      <TextFormField
                        {...field("ip_no")}
                        label="IP Number"
                        required={state.form.suggestion === "A"}
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4 pb-4">
                  <div className="flex flex-col">
                    {sectionTitle("Diagnosis", true)}
                    <p className="text-gray-700 text-sm -mt-4 mb-4 space-x-1">
                      <span className="font-medium">
                        Either Provisional or Final Diagnosis is mandatory
                      </span>
                      <span>| Diagnoses as per ICD-11 recommended by WHO</span>
                    </p>
                  </div>

                  <div ref={fieldRef["icd11_provisional_diagnoses_object"]}>
                    <DiagnosisSelectFormField
                      {...field("icd11_provisional_diagnoses_object")}
                      multiple
                      label="Provisional Diagnosis"
                    />
                  </div>

                  <div ref={fieldRef["icd11_diagnoses_object"]}>
                    <DiagnosisSelectFormField
                      {...field("icd11_diagnoses_object")}
                      multiple
                      label="Final Diagnosis"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 gap-x-6">
                  {String(state.form.consultation_status) !== "1" && (
                    <>
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
                              investigations={InvestigationAdvice}
                              setInvestigations={setInvestigationAdvice}
                            />
                            <LegacyErrorHelperText
                              error={state.errors.investigation}
                            />
                          </div>
                          <div
                            id="procedure"
                            className="col-span-6"
                            ref={fieldRef["procedure"]}
                          >
                            <FieldLabel>Procedures</FieldLabel>
                            <ProcedureBuilder
                              procedures={procedures}
                              setProcedures={setProcedures}
                            />
                            <LegacyErrorHelperText
                              error={state.errors.procedure}
                            />
                          </div>
                          <div
                            className="col-span-6"
                            ref={fieldRef["prescribed_medication"]}
                          >
                            <TextAreaFormField
                              {...field("prescribed_medication")}
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
                            ref={fieldRef["verified_by"]}
                          >
                            <TextAreaFormField
                              {...field("verified_by")}
                              label="Verified by"
                              required
                              placeholder="Attending Doctors Name and Designation"
                            />
                          </div>

                          <div className="flex flex-col md:flex-row gap-3 col-span-6">
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
                                {...field("action")}
                                label="Action"
                                position="above"
                                options={TELEMEDICINE_ACTIONS}
                                optionLabel={(option) => option.desc}
                                optionValue={(option) => option.text}
                              />
                            </div>
                          </div>

                          <CheckBoxFormField
                            className="col-span-6"
                            {...field("is_telemedicine")}
                            label="Is Telemedicine required for the patient?"
                            onChange={handleFormFieldChange}
                          />

                          {JSON.parse(state.form.is_telemedicine) && (
                            <div
                              className="flex-[2] col-span-6"
                              ref={fieldRef["assigned_to"]}
                            >
                              <OnlineUsersSelect
                                userId={state.form.assigned_to}
                                selectedUser={state.form.assigned_to_object}
                                onSelect={handleDoctorSelect}
                                user_type="Doctor"
                                outline
                              />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
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
                <div className="mt-4 bg-white rounded max-w-3xl px-11 py-8 mx-auto">
                  <h4>Update Bed</h4>
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
